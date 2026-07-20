import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Minus, Search, Leaf, Drumstick } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { CartItem } from '@/hooks/useCanteenCart';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
  image_url: string | null;
}

interface MenuViewProps {
  vendorId: string;
  vendorName: string;
  onBack: () => void;
  cartItems: CartItem[];
  onAddItem: (item: Omit<CartItem, 'quantity'>) => void;
  onUpdateQuantity: (menuItemId: string, qty: number) => void;
  cartTotal: number;
  cartCount: number;
  onCheckout: () => void;
}

type FilterType = 'all' | 'veg' | 'non_veg' | 'snacks' | 'meals' | 'drinks';

export default function MenuView({ vendorId, vendorName, onBack, cartItems, onAddItem, onUpdateQuantity, cartTotal, cartCount, onCheckout }: MenuViewProps) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('id, name, description, price, category, is_available, image_url')
        .eq('vendor_id', vendorId)
        .eq('is_available', true)
        .order('category');
      if (active && data) setItems(data as MenuItem[]);
      if (active) setLoading(false);
    };
    load();

    const channel = supabase
      .channel(`menu-items-student-${vendorId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items', filter: `vendor_id=eq.${vendorId}` },
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [vendorId]);

  const filters: { label: string; value: FilterType; icon?: any }[] = [
    { label: 'All', value: 'all' },
    { label: '🟢 Veg', value: 'veg' },
    { label: '🔴 Non-Veg', value: 'non_veg' },
    { label: '🍿 Snacks', value: 'snacks' },
    { label: '🍛 Meals', value: 'meals' },
    { label: '🥤 Drinks', value: 'drinks' },
  ];

  const filtered = items.filter(item => {
    if (filter !== 'all' && item.category !== filter) return false;
    if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getCartQty = (itemId: string) => cartItems.find(c => c.menuItemId === itemId)?.quantity || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-border/50 space-y-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="glass rounded-full p-3 hover:bg-primary/10 transition-all group">
            <ArrowLeft className="w-5 h-5 text-foreground group-hover:text-primary" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-semibold text-foreground truncate">{vendorName}</h1>
            <p className="text-xs text-muted-foreground">{items.length} items available</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search menu..."
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {filters.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === f.value
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Menu Items */}
      <main className="flex-1 p-4 pb-28 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {loading ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-xl bg-muted/50 animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-4xl mb-2">🍽️</p>
              <p>No items found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(item => {
                const qty = getCartQty(item.id);
                const isVeg = item.category === 'veg' || item.category === 'meals';
                return (
                  <div key={item.id} className="flex items-center gap-3 glass rounded-xl p-3 border border-transparent hover:border-orange-500/20 transition-all">
                    {/* Veg/Non-veg indicator */}
                    <div className="shrink-0">
                      <div className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                        item.category === 'non_veg' ? 'border-red-500' : 'border-green-500'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          item.category === 'non_veg' ? 'bg-red-500' : 'bg-green-500'
                        }`} />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm">{item.name}</h3>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
                      )}
                      <p className="text-sm font-bold text-foreground mt-1">₹{item.price}</p>
                    </div>

                    {/* Add/Quantity controls */}
                    <div className="shrink-0">
                      {qty === 0 ? (
                        <button
                          onClick={() => onAddItem({
                            menuItemId: item.id,
                            name: item.name,
                            price: item.price,
                            vendorId,
                            vendorName,
                          })}
                          className="px-4 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
                        >
                          ADD
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-orange-500 rounded-lg px-1">
                          <button
                            onClick={() => onUpdateQuantity(item.id, qty - 1)}
                            className="p-1 text-white hover:bg-orange-600 rounded"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="text-white font-bold text-sm w-5 text-center">{qty}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, qty + 1)}
                            className="p-1 text-white hover:bg-orange-600 rounded"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 z-50">
          <button
            onClick={onCheckout}
            className="w-full max-w-2xl mx-auto flex items-center justify-between px-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-xl hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-sm font-bold">{cartCount}</span>
              <span className="text-sm font-medium">item{cartCount > 1 ? 's' : ''} added</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">₹{cartTotal}</span>
              <span className="text-sm">→ Checkout</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
