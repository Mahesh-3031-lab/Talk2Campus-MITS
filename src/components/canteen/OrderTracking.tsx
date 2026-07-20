import { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, CheckCircle2, Clock, ChefHat, PackageCheck, RefreshCw, Copy, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  total_cost: number;
  created_at: string;
  vendor_name: string;
  items: OrderItem[];
}

interface OrderTrackingProps {
  studentRollNumber: string;
  onBack: () => void;
  highlightOrderId?: string | null;
}

const STATUS_STEPS = [
  { key: 'received', label: 'Order Received', icon: CheckCircle2, emoji: '📋' },
  { key: 'preparing', label: 'Preparing', icon: ChefHat, emoji: '👨‍🍳' },
  { key: 'ready', label: 'Ready for Pickup', icon: PackageCheck, emoji: '✅' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, emoji: '🎉' },
];

export default function OrderTracking({ studentRollNumber, onBack, highlightOrderId }: OrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data: orderRows } = await supabase
      .from('canteen_orders')
      .select('id, status, total_cost, created_at, vendor_id')
      .eq('student_roll_number', studentRollNumber)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!orderRows || orderRows.length === 0) {
      setOrders([]);
      setLoading(false);
      return;
    }

    // Get vendor names
    const vendorIds = [...new Set(orderRows.map(o => o.vendor_id))];
    const { data: vendors } = await supabase
      .from('canteen_vendors')
      .select('id, name')
      .in('id', vendorIds);
    const vendorMap = new Map((vendors || []).map(v => [v.id, v.name]));

    // Get order items
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
      id: o.id,
      status: o.status as string,
      total_cost: Number(o.total_cost),
      created_at: o.created_at,
      vendor_name: vendorMap.get(o.vendor_id) || 'Unknown',
      items: itemsByOrder.get(o.id) || [],
    })));
    setLoading(false);
  }, [studentRollNumber]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('order-tracking')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'canteen_orders' }, (payload) => {
        const updated = payload.new as any;
        setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const copyOrderId = (id: string) => {
    navigator.clipboard.writeText(id.slice(0, 8).toUpperCase());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusIndex = (status: string) => STATUS_STEPS.findIndex(s => s.key === status);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="glass rounded-full p-3 hover:bg-primary/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary" />
          </button>
          <h1 className="font-display text-lg font-semibold text-foreground">My Orders</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchOrders} className="rounded-full">
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </header>

      <main className="flex-1 p-4 pb-8 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {loading ? (
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-32 rounded-2xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-5xl mb-3">📦</p>
              <p className="font-medium">No orders yet</p>
              <p className="text-sm mt-1">Place your first order from a campus canteen!</p>
            </div>
          ) : (
            orders.map(order => {
              const statusIdx = getStatusIndex(order.status);
              const isActive = order.status !== 'completed';
              return (
                <div
                  key={order.id}
                  className={`glass rounded-2xl p-4 space-y-3 border transition-all ${
                    highlightOrderId === order.id ? 'border-orange-500 shadow-lg' : isActive ? 'border-orange-500/20' : 'border-transparent'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="font-semibold text-foreground">{order.vendor_name}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(order.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyOrderId(order.id)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                        title="Copy Order ID"
                      >
                        {copiedId === order.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      <span className="font-bold text-foreground">₹{order.total_cost}</span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="text-xs text-muted-foreground">
                    {order.items.map((item, i) => (
                      <span key={i}>{item.item_name} × {item.quantity}{i < order.items.length - 1 ? ', ' : ''}</span>
                    ))}
                  </div>

                  {/* Status Progress */}
                  {isActive && (
                    <div className="flex items-center gap-1 pt-1">
                      {STATUS_STEPS.slice(0, 3).map((step, i) => {
                        const isCompleted = i <= statusIdx;
                        const isCurrent = i === statusIdx;
                        return (
                          <div key={step.key} className="flex items-center flex-1">
                            <div className={`flex items-center gap-1.5 ${isCurrent ? 'text-orange-500' : isCompleted ? 'text-green-500' : 'text-muted-foreground/40'}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                                isCurrent ? 'bg-orange-500/20' : isCompleted ? 'bg-green-500/20' : 'bg-muted/50'
                              }`}>
                                {step.emoji}
                              </div>
                              <span className="text-[10px] font-medium hidden sm:inline">{step.label}</span>
                            </div>
                            {i < 2 && (
                              <div className={`flex-1 h-0.5 mx-1 rounded ${i < statusIdx ? 'bg-green-500' : 'bg-muted/50'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {order.status === 'completed' && (
                    <div className="flex items-center gap-2 text-xs text-green-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">Order Completed</span>
                    </div>
                  )}

                  {order.status === 'ready' && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-center">
                      <p className="text-sm font-bold text-green-600">🎉 Ready for Pickup!</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Show order ID at the counter</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
