import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Clock, Star, ChevronRight, LogOut, ShoppingBag, MapPin, RotateCcw, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Vendor {
  id: string;
  name: string;
  cuisine_type: string;
  is_open: boolean;
  prep_time_mins: number;
  rating: number;
  location_tag: string | null;
}

interface PastOrderItem {
  item_name: string;
  quantity: number;
  price: number;
  vendor_name: string;
  vendor_id: string;
  ordered_at: string;
}

interface VendorListProps {
  onSelectVendor: (vendor: Vendor) => void;
  onBack: () => void;
  onLogout: () => void;
  onViewOrders: () => void;
  studentName: string;
  studentRoll: string;
  cartCount: number;
  onCartClick: () => void;
}

export type { Vendor };

const VENDOR_META: Record<string, { emoji: string; gradient: string }> = {
  "Ekadant's Cafe": { emoji: '☕', gradient: 'from-amber-500/20 to-orange-500/20' },
  "Lickies Ice Creams & Cool Drinks": { emoji: '🍦', gradient: 'from-sky-400/20 to-cyan-500/20' },
  "Main Canteen": { emoji: '🍛', gradient: 'from-orange-500/20 to-red-500/20' },
};

function getMealPeriod(): { label: string; emoji: string; suggestion: string; vendorHint: string } {
  const h = new Date().getHours();
  if (h >= 7 && h < 10) return { label: 'Breakfast', emoji: '🌅', suggestion: 'Start your day with a hearty breakfast', vendorHint: 'Main Canteen' };
  if (h >= 10 && h < 12) return { label: 'Snack Time', emoji: '☕', suggestion: 'Grab a quick snack or coffee', vendorHint: "Ekadant's Cafe" };
  if (h >= 12 && h < 15) return { label: 'Lunch', emoji: '🍛', suggestion: 'Time for a filling lunch', vendorHint: 'Main Canteen' };
  if (h >= 15 && h < 18) return { label: 'Evening Snacks', emoji: '🍦', suggestion: 'Cool down with a refreshing treat', vendorHint: 'Lickies Ice Creams & Cool Drinks' };
  if (h >= 18 && h < 21) return { label: 'Dinner', emoji: '🍽️', suggestion: 'End your day with a great meal', vendorHint: 'Main Canteen' };
  return { label: 'Late Night', emoji: '🌙', suggestion: 'Craving a midnight snack?', vendorHint: "Ekadant's Cafe" };
}

export default function VendorList({ onSelectVendor, onBack, onLogout, onViewOrders, studentName, studentRoll, cartCount, onCartClick }: VendorListProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [pastItems, setPastItems] = useState<PastOrderItem[]>([]);

  const meal = useMemo(() => getMealPeriod(), []);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('canteen_vendors')
        .select('id, name, cuisine_type, is_open, prep_time_mins, rating, location_tag')
        .order('name');
      if (data) setVendors(data as Vendor[]);
      setLoading(false);
    })();
  }, []);

  // Fetch past order items for "Order Again"
  useEffect(() => {
    if (!studentRoll) return;
    (async () => {
      const { data: orders } = await supabase
        .from('canteen_orders')
        .select('id, vendor_id, created_at')
        .eq('student_roll_number', studentRoll)
        .order('created_at', { ascending: false })
        .limit(10);
      if (!orders || orders.length === 0) return;

      const orderIds = orders.map(o => o.id);
      const { data: items } = await supabase
        .from('canteen_order_items')
        .select('item_name, quantity, price, order_id')
        .in('order_id', orderIds);
      if (!items) return;

      // Get vendor names
      const { data: vendorData } = await supabase
        .from('canteen_vendors')
        .select('id, name');
      const vendorMap = Object.fromEntries((vendorData || []).map(v => [v.id, v.name]));

      // Deduplicate by item_name, keep most recent
      const seen = new Set<string>();
      const result: PastOrderItem[] = [];
      for (const order of orders) {
        const orderItems = items.filter(i => i.order_id === order.id);
        for (const item of orderItems) {
          if (!seen.has(item.item_name)) {
            seen.add(item.item_name);
            result.push({
              item_name: item.item_name,
              quantity: item.quantity,
              price: item.price,
              vendor_name: vendorMap[order.vendor_id] || '',
              vendor_id: order.vendor_id,
              ordered_at: order.created_at,
            });
          }
        }
        if (result.length >= 6) break;
      }
      setPastItems(result);
    })();
  }, [studentRoll]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      <header className="p-4 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="glass rounded-full p-3 hover:bg-primary/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary" />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold text-foreground">Campus Food</h1>
            <p className="text-xs text-muted-foreground">Hey, {studentName} 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onViewOrders} className="relative p-2.5 rounded-full hover:bg-primary/10 transition-colors">
            <ShoppingBag className="w-5 h-5 text-foreground" />
          </button>
          {cartCount > 0 && (
            <button onClick={onCartClick} className="relative px-3 py-1.5 rounded-full bg-orange-500 text-white text-sm font-semibold">
              🛒 {cartCount}
            </button>
          )}
          <button onClick={onLogout} className="p-2.5 rounded-full hover:bg-destructive/10 transition-colors">
            <LogOut className="w-5 h-5 text-destructive" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-8">
        <div className="max-w-2xl mx-auto space-y-4">
          {/* Time-based suggestion */}
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 p-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">{meal.emoji} {meal.label}</span>
            </div>
            <h2 className="font-display text-xl font-bold text-foreground">{meal.suggestion}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Try <span className="font-medium text-foreground">{meal.vendorHint}</span> right now
            </p>
            {(() => {
              const hintVendor = vendors.find(v => v.name === meal.vendorHint && v.is_open);
              return hintVendor ? (
                <button
                  onClick={() => onSelectVendor(hintVendor)}
                  className="mt-3 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Browse Menu →
                </button>
              ) : null;
            })()}
          </div>

          {/* Order Again */}
          {pastItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-foreground">Order Again</h3>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {pastItems.map((item, i) => {
                  const vendor = vendors.find(v => v.id === item.vendor_id);
                  return (
                    <button
                      key={`${item.item_name}-${i}`}
                      onClick={() => vendor && vendor.is_open && onSelectVendor(vendor)}
                      disabled={!vendor?.is_open}
                      className="flex-shrink-0 w-36 rounded-xl border border-border/50 bg-card p-3 text-left hover:border-primary/30 transition-all disabled:opacity-50"
                    >
                      <p className="text-sm font-medium text-foreground truncate">{item.item_name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">₹{item.price}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">{item.vendor_name}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-28 rounded-2xl bg-muted/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map(vendor => {
                const meta = VENDOR_META[vendor.name] || { emoji: '🍽️', gradient: 'from-muted/20 to-muted/30' };
                return (
                  <button
                    key={vendor.id}
                    onClick={() => vendor.is_open && onSelectVendor(vendor)}
                    disabled={!vendor.is_open}
                    className={`w-full flex items-center gap-4 rounded-2xl p-4 border transition-all text-left ${
                      vendor.is_open
                        ? 'glass border-transparent hover:border-orange-500/30 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                        : 'bg-muted/30 border-border/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-2xl shrink-0`}>
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground truncate">{vendor.name}</h3>
                        {!vendor.is_open && (
                          <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">Closed</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{vendor.cuisine_type}</p>
                      {vendor.location_tag && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3 text-orange-500 shrink-0" />
                          <span>{vendor.location_tag}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                          {vendor.rating}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {vendor.prep_time_mins} min
                        </span>
                      </div>
                    </div>
                    {vendor.is_open && <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
