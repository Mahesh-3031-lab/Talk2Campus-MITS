import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, RefreshCw, LogOut, Bell, Package, ChefHat, HandPlatter, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface OrderItem { item_name: string; quantity: number; price: number; }
interface VendorOrder {
  id: string;
  student_roll_number: string;
  status: string;
  total_cost: number;
  created_at: string;
  items: OrderItem[];
}

interface VendorOrderListProps {
  vendorId: string;
  vendorName: string;
  onLogout: () => void;
  onBack: () => void;
}

const STATUS_CONFIG = {
  received: {
    label: 'New Orders',
    icon: Bell,
    emoji: '📋',
    color: 'border-blue-500',
    badge: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
    actionLabel: 'Start Preparing',
    actionColor: 'from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600',
    headerBg: 'bg-blue-500/10',
    next: 'preparing',
  },
  preparing: {
    label: 'Preparing',
    icon: ChefHat,
    emoji: '👨‍🍳',
    color: 'border-orange-500',
    badge: 'bg-orange-500/15 text-orange-600 border-orange-500/30',
    actionLabel: 'Ready for Pickup',
    actionColor: 'from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600',
    headerBg: 'bg-orange-500/10',
    next: 'ready',
  },
  ready: {
    label: 'Ready for Pickup',
    icon: HandPlatter,
    emoji: '✅',
    color: 'border-green-500',
    badge: 'bg-green-500/15 text-green-600 border-green-500/30',
    actionLabel: 'Mark Completed',
    actionColor: 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700',
    headerBg: 'bg-green-500/10',
    next: 'completed',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    emoji: '🎉',
    color: 'border-muted',
    badge: 'bg-muted text-muted-foreground border-border',
    actionLabel: '',
    actionColor: '',
    headerBg: 'bg-muted/50',
    next: null,
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export default function VendorOrderList({ vendorId, vendorName, onLogout, onBack }: VendorOrderListProps) {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [view, setView] = useState<'board' | 'list'>('board');
  const [showCompleted, setShowCompleted] = useState(false);
  const [newOrderFlash, setNewOrderFlash] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data: orderRows } = await supabase
      .from('canteen_orders')
      .select('id, student_roll_number, status, total_cost, created_at')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!orderRows || orderRows.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const orderIds = orderRows.map(o => o.id);
    const { data: itemRows } = await supabase
      .from('canteen_order_items')
      .select('order_id, item_name, quantity, price')
      .in('order_id', orderIds);

    const itemsByOrder = new Map<string, OrderItem[]>();
    (itemRows || []).forEach(item => {
      const list = itemsByOrder.get(item.order_id) || [];
      list.push({ item_name: item.item_name, quantity: item.quantity, price: Number(item.price) });
      itemsByOrder.set(item.order_id, list);
    });

    setOrders(orderRows.map(o => ({
      ...o,
      total_cost: Number(o.total_cost),
      status: o.status as string,
      items: itemsByOrder.get(o.id) || [],
    })));
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      // Play a second tone for a pleasant two-tone chime
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.value = 1174;
      osc2.type = 'triangle';
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.65);
      osc2.start(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.65);
    } catch (e) {
      console.warn('Could not play notification sound', e);
    }
  }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('vendor-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'canteen_orders' }, (payload) => {
        const newOrder = payload.new as any;
        if (newOrder.vendor_id === vendorId) {
          playNotificationSound();
          setNewOrderFlash(true);
          setTimeout(() => setNewOrderFlash(false), 2000);
          fetchOrders();
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'canteen_orders' }, (payload) => {
        const updated = payload.new as any;
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [vendorId, fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    await supabase.from('canteen_orders').update({ status: newStatus as any }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    setUpdatingId(null);
  };

  const formatTime = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

  const getOrdersByStatus = (status: StatusKey) => orders.filter(o => o.status === status);

  const activeStatuses: StatusKey[] = ['received', 'preparing', 'ready'];
  const totalActive = orders.filter(o => o.status !== 'completed').length;
  const todayRevenue = orders
    .filter(o => new Date(o.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, o) => sum + o.total_cost, 0);

  const renderOrderCard = (order: VendorOrder, config: typeof STATUS_CONFIG[StatusKey]) => (
    <div
      key={order.id}
      className={`rounded-xl border-l-4 ${config.color} bg-card p-3 space-y-2 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Order Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">
            #{order.id.slice(0, 6).toUpperCase()}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${config.badge}`}>
            {order.status.toUpperCase()}
          </span>
        </div>
        <span className="text-lg font-bold text-foreground">₹{order.total_cost}</span>
      </div>

      {/* Student & Time */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">🎓 {order.student_roll_number}</span>
        <span>{formatTime(order.created_at)} · {formatDate(order.created_at)}</span>
      </div>

      {/* Items Table */}
      <div className="bg-muted/40 rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border/50">
          <span>Item</span>
          <span className="text-center">Qty</span>
          <span className="text-right">Price</span>
        </div>
        {order.items.map((item, i) => (
          <div
            key={i}
            className={`grid grid-cols-[1fr_auto_auto] gap-x-3 px-3 py-2 text-sm ${
              i < order.items.length - 1 ? 'border-b border-border/30' : ''
            }`}
          >
            <span className="font-medium text-foreground truncate">{item.item_name}</span>
            <span className="text-center text-muted-foreground font-mono">×{item.quantity}</span>
            <span className="text-right font-semibold text-foreground">₹{item.price * item.quantity}</span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto] gap-x-3 px-3 py-2 border-t border-border/50 bg-muted/30">
          <span className="text-xs font-bold text-foreground">Total</span>
          <span className="text-right text-sm font-bold text-foreground">₹{order.total_cost}</span>
        </div>
      </div>

      {/* Action Button */}
      {config.next && (
        <Button
          onClick={() => updateStatus(order.id, config.next!)}
          disabled={updatingId === order.id}
          size="sm"
          className={`w-full rounded-lg bg-gradient-to-r ${config.actionColor} text-white font-semibold text-sm`}
        >
          {updatingId === order.id ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <config.icon className="w-4 h-4 mr-2" />
          )}
          {updatingId === order.id ? 'Updating...' : config.actionLabel}
        </Button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="rounded-full p-2.5 hover:bg-muted transition-all">
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-foreground">{vendorName}</h1>
              <p className="text-xs text-muted-foreground">Admin Panel · Order Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={fetchOrders} className="rounded-full">
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={onLogout} className="rounded-full text-destructive hover:bg-destructive/10">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="px-4 py-3 border-b border-border/30 bg-card/50">
        <div className="max-w-6xl mx-auto flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 min-w-fit">
            <Bell className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600">{getOrdersByStatus('received').length} New</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 min-w-fit">
            <ChefHat className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-orange-600">{getOrdersByStatus('preparing').length} Preparing</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 border border-green-500/20 min-w-fit">
            <HandPlatter className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-green-600">{getOrdersByStatus('ready').length} Ready</span>
          </div>
          <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border min-w-fit">
            <Package className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">₹{todayRevenue} today</span>
          </div>
        </div>
      </div>

      {/* Main Content - Kanban Board */}
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="p-4 max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-10 rounded-xl bg-muted/50 animate-pulse" />
                <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />
                <div className="h-40 rounded-xl bg-muted/30 animate-pulse" />
              </div>
            ))}
          </div>
        ) : totalActive === 0 && !showCompleted ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-3">📋</p>
            <p className="font-semibold text-lg">No active orders</p>
            <p className="text-sm mt-1">New orders will appear here in real-time</p>
            {getOrdersByStatus('completed').length > 0 && (
              <Button variant="outline" className="mt-4 rounded-full" onClick={() => setShowCompleted(true)}>
                View {getOrdersByStatus('completed').length} completed orders
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4 max-w-6xl mx-auto overflow-x-auto h-full">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-0">
              {activeStatuses.map(status => {
                const config = STATUS_CONFIG[status];
                const StatusIcon = config.icon;
                const statusOrders = getOrdersByStatus(status);

                return (
                  <div key={status} className={`flex flex-col min-h-0 transition-all duration-300 ${status === 'received' && newOrderFlash ? 'animate-pulse ring-2 ring-primary rounded-xl' : ''}`}>
                    {/* Column Header */}
                    <div className={`flex items-center gap-2 px-3 py-2.5 rounded-t-xl border border-b-0 border-border/30 transition-colors duration-300 ${status === 'received' && newOrderFlash ? 'bg-primary/20' : config.headerBg}`}>
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-bold text-foreground">{config.label}</span>
                      <span className={`ml-auto px-2 py-0.5 rounded-full text-xs font-bold border ${config.badge}`}>
                        {statusOrders.length}
                      </span>
                    </div>

                    {/* Column Body */}
                    <div className="flex-1 overflow-y-auto border border-t-0 border-border/30 rounded-b-xl bg-muted/10 p-2 space-y-2 max-h-[calc(100vh-280px)]">
                      {statusOrders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground/50">
                          <p className="text-2xl mb-1">{config.emoji}</p>
                          <p className="text-xs">No orders</p>
                        </div>
                      ) : (
                        statusOrders.map(order => renderOrderCard(order, config))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completed Section */}
            {(showCompleted || getOrdersByStatus('completed').length > 0) && (
              <div className="mt-4">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Completed Orders ({getOrdersByStatus('completed').length})
                  <span className="text-xs">{showCompleted ? '▲' : '▼'}</span>
                </button>
                {showCompleted && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {getOrdersByStatus('completed').map(order =>
                      renderOrderCard(order, STATUS_CONFIG.completed)
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
