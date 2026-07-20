import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2, Image as ImageIcon, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  is_available: boolean;
  image_url: string | null;
}

interface MenuManagementProps {
  vendorId: string;
}

const CATEGORIES = [
  { value: 'meals', label: '🍛 Meals' },
  { value: 'snacks', label: '🍿 Snacks' },
  { value: 'drinks', label: '🥤 Drinks' },
  { value: 'veg', label: '🥬 Veg' },
  { value: 'non_veg', label: '🍗 Non-Veg' },
];

export default function MenuManagement({ vendorId }: MenuManagementProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState('meals');
  const [formAvailable, setFormAvailable] = useState(true);
  const [formImageUrl, setFormImageUrl] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('category')
      .order('name');
    setItems((data || []).map(d => ({ ...d, price: Number(d.price) })));
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setFormName(''); setFormDesc(''); setFormPrice(''); setFormCategory('meals');
    setFormAvailable(true); setFormImageUrl(''); setEditingItem(null); setShowForm(false);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormDesc(item.description || '');
    setFormPrice(String(item.price));
    setFormCategory(item.category);
    setFormAvailable(item.is_available);
    setFormImageUrl(item.image_url || '');
    setShowForm(true);
  };

  const generateImage = async () => {
    if (!formName.trim()) return;
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-food-image', {
        body: { itemName: formName, category: formCategory },
      });
      if (data?.imageUrl) {
        setFormImageUrl(data.imageUrl);
        toast({ title: '🎨 Image Generated!', description: 'AI food image created successfully' });
      } else {
        toast({ title: 'Image generation failed', description: 'You can still save the item without an image', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Image generation error', variant: 'destructive' });
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrice) return;
    setSaving(true);
    const payload = {
      name: formName.trim(),
      description: formDesc.trim() || null,
      price: parseFloat(formPrice),
      category: formCategory as any,
      is_available: formAvailable,
      image_url: formImageUrl || null,
      vendor_id: vendorId,
    };

    if (editingItem) {
      const { error } = await supabase.from('menu_items').update(payload).eq('id', editingItem.id);
      if (error) {
        toast({ title: 'Update failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: '✅ Item Updated' });
        resetForm();
        fetchItems();
      }
    } else {
      const { error } = await supabase.from('menu_items').insert(payload);
      if (error) {
        toast({ title: 'Add failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: '✅ Item Added' });
        resetForm();
        fetchItems();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) {
      toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: '🗑️ Item Deleted' });
      fetchItems();
    }
    setDeletingId(null);
  };

  const filtered = items.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Menu Items ({items.length})</h2>
        <Button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search menu items..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-sm"
        />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="glass rounded-2xl p-4 space-y-3 border border-orange-500/20">
          <h3 className="font-semibold text-foreground">{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
          
          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="Item name (e.g. Paneer Butter Masala)"
            className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
          
          <textarea
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={formPrice}
              onChange={e => setFormPrice(e.target.value)}
              placeholder="Price (₹)"
              min="0"
              step="1"
              className="h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value)}
              className="h-10 px-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={formAvailable} onChange={e => setFormAvailable(e.target.checked)} className="rounded" />
            <span className="text-foreground">Available for ordering</span>
          </label>

          {/* AI Image Generation */}
          <div className="flex items-center gap-2">
            {formImageUrl && (
              <img src={formImageUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-border" />
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={generateImage}
              disabled={generatingImage || !formName.trim()}
              className="rounded-lg text-xs"
            >
              {generatingImage ? <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Generating...</> : <><ImageIcon className="w-3 h-3 mr-1" /> Generate AI Image</>}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving || !formName.trim() || !formPrice} size="sm" className="rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
            <Button onClick={resetForm} variant="ghost" size="sm" className="rounded-lg">Cancel</Button>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted/30 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-3xl mb-2">🍽️</p>
          <p className="text-sm">{items.length === 0 ? 'No menu items yet. Add your first item!' : 'No items match your search.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(item => (
            <div key={item.id} className="flex items-center gap-3 glass rounded-xl p-3">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-14 h-14 rounded-lg object-cover border border-border" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center text-xl">
                  {item.category === 'drinks' ? '🥤' : item.category === 'snacks' ? '🍿' : '🍛'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground truncate">{item.name}</h3>
                  {!item.is_available && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-destructive/10 text-destructive border border-destructive/30">Unavailable</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">{item.description || CATEGORIES.find(c => c.value === item.category)?.label}</p>
                <p className="text-sm font-bold text-foreground mt-0.5">₹{item.price}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deletingId === item.id}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin text-destructive" /> : <Trash2 className="w-4 h-4 text-destructive" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
