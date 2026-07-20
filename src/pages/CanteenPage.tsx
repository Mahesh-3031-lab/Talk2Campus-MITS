import { useState, useCallback, useEffect } from 'react';
import SEOHead from "@/components/SEOHead";
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCanteenCart } from '@/hooks/useCanteenCart';
import { checkRateLimit, sanitizeRollNumber, checkActionRateLimit } from '@/lib/security';
import CanteenLogin from '@/components/canteen/CanteenLogin';
import VendorList, { Vendor } from '@/components/canteen/VendorList';
import MenuView from '@/components/canteen/MenuView';
import OrderCheckout from '@/components/canteen/OrderCheckout';
import OrderTracking from '@/components/canteen/OrderTracking';

type View = 'login' | 'vendors' | 'menu' | 'checkout' | 'tracking';

const CanteenPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const cart = useCanteenCart();
  const { isVendor, loading: roleLoading } = useUserRole();

  // RBAC: vendors must use the vendor dashboard, not the student ordering screen
  useEffect(() => {
    if (!roleLoading && isVendor) {
      toast({ title: 'Vendor account detected', description: 'Redirecting you to the vendor dashboard.' });
      navigate('/canteen/vendor', { replace: true });
    }
  }, [roleLoading, isVendor, navigate, toast]);

  const [view, setView] = useState<View>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentRoll, setStudentRoll] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);

  const handleLogin = useCallback(async (rollNumber: string, password: string) => {
    if (!checkRateLimit('canteen_login', 5, 60_000)) {
      setError('Too many login attempts. Please wait a minute before trying again.');
      return;
    }
    const cleanRoll = sanitizeRollNumber(rollNumber);
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('gems-attendance', {
        body: { action: 'login', rollNumber: cleanRoll, password },
      });
      if (fnError) throw new Error(fnError.message || 'Authentication failed');
      if (data.error) { setError(data.error); return; }
      if (data.success) {
        setStudentRoll(cleanRoll);
        setStudentName(data.attendance?.studentName || cleanRoll);
        setView('vendors');
        toast({ title: 'Welcome! 🍽️', description: 'Browse canteens and order food' });
      } else {
        setError('Authentication failed. Please check your credentials.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSelectVendor = useCallback((vendor: Vendor) => {
    setSelectedVendor(vendor);
    setView('menu');
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (!selectedVendor || cart.items.length === 0) return;
    if (!checkActionRateLimit('CANTEEN_ORDER')) {
      toast({ title: 'Order limit', description: 'Please wait before placing another order.' });
      return;
    }
    setIsPlacingOrder(true);

    try {
      const { data: orderData, error: orderErr } = await supabase
        .from('canteen_orders')
        .insert({
          student_roll_number: studentRoll,
          vendor_id: selectedVendor.id,
          total_cost: cart.totalPrice,
          status: 'received' as any,
        })
        .select('id')
        .single();

      if (orderErr) throw orderErr;

      const orderItems = cart.items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menuItemId,
        item_name: item.name,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsErr } = await supabase.from('canteen_order_items').insert(orderItems);
      if (itemsErr) throw itemsErr;

      setLastOrderId(orderData.id);
      cart.clearCart();
      setView('tracking');
      const locationMsg = selectedVendor.location_tag ? ` (${selectedVendor.location_tag})` : '';
      toast({ title: '🎉 Order Placed!', description: `Order #${orderData.id.slice(0, 8).toUpperCase()} — pick up at ${selectedVendor.name}${locationMsg}` });

      // Auto-progress simulation (fallback)
      setTimeout(async () => {
        await supabase.from('canteen_orders').update({ status: 'preparing' as any }).eq('id', orderData.id);
      }, 15000);
      setTimeout(async () => {
        await supabase.from('canteen_orders').update({ status: 'ready' as any }).eq('id', orderData.id);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Talk2Campus - 🍽️ Food Ready!', {
            body: `Your order from ${selectedVendor.name} is ready for pickup!`,
            icon: '/pwa-192x192.png',
          });
        }
      }, 45000);
    } catch (err) {
      console.error('Order placement error:', err);
      toast({ title: 'Order Failed', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setIsPlacingOrder(false);
    }
  }, [selectedVendor, cart, studentRoll, toast]);

  const handleLogout = useCallback(() => {
    setStudentRoll('');
    setStudentName('');
    setSelectedVendor(null);
    cart.clearCart();
    setView('login');
    setError(null);
  }, [cart]);

  const seo = <SEOHead title="Canteen – Order Food at MITS" description="Order food from Ekadant's Cafe, Lickies Ice Creams, and Main Canteen at MITS campus." path="/canteen" />;

  if (view === 'login') {
    return <>{seo}<CanteenLogin onLogin={handleLogin} onBack={() => navigate(-1)} isLoading={isLoading} error={error} /></>;
  }
  if (view === 'vendors') {
    return (
      <>{seo}<VendorList
        onSelectVendor={handleSelectVendor}
        onBack={() => navigate('/')}
        onLogout={handleLogout}
        onViewOrders={() => setView('tracking')}
        studentName={studentName}
        studentRoll={studentRoll}
        cartCount={cart.totalItems}
        onCartClick={() => setView('checkout')}
      /></>
    );
  }
  if (view === 'menu' && selectedVendor) {
    return (
      <MenuView
        vendorId={selectedVendor.id}
        vendorName={selectedVendor.name}
        onBack={() => setView('vendors')}
        cartItems={cart.items}
        onAddItem={cart.addItem}
        onUpdateQuantity={cart.updateQuantity}
        cartTotal={cart.totalPrice}
        cartCount={cart.totalItems}
        onCheckout={() => setView('checkout')}
      />
    );
  }
  if (view === 'checkout') {
    return (
      <OrderCheckout
        items={cart.items}
        totalPrice={cart.totalPrice}
        studentRollNumber={studentRoll}
        vendorName={selectedVendor?.name || ''}
        vendorLocation={selectedVendor?.location_tag || undefined}
        prepTime={selectedVendor?.prep_time_mins || 15}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onClearCart={cart.clearCart}
        onPlaceOrder={handlePlaceOrder}
        onBack={() => selectedVendor ? setView('menu') : setView('vendors')}
        isPlacing={isPlacingOrder}
      />
    );
  }
  if (view === 'tracking') {
    return (
      <OrderTracking
        studentRollNumber={studentRoll}
        onBack={() => setView('vendors')}
        highlightOrderId={lastOrderId}
      />
    );
  }
  return null;
};

export default CanteenPage;
