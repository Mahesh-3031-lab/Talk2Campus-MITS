import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import VendorLogin from '@/components/canteen/VendorLogin';
import VendorDashboard from '@/components/canteen/VendorDashboard';

const VendorDashboardPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [vendorName, setVendorName] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // RBAC: require 'vendor' role
        const { data: roleRow } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'vendor')
          .maybeSingle();

        if (!roleRow) {
          await supabase.auth.signOut();
          setError('This account does not have vendor access.');
          setCheckingSession(false);
          return;
        }

        const { data: vendor } = await supabase
          .from('canteen_vendors')
          .select('id, name')
          .eq('user_id', session.user.id)
          .single();
        if (vendor) {
          setVendorId(vendor.id);
          setVendorName(vendor.name);
        }
      }
      setCheckingSession(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_OUT') {
        setVendorId(null);
        setVendorName('');
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) { setError('Invalid credentials. Please try again.'); return; }

      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .eq('role', 'vendor')
        .maybeSingle();

      if (!roleRow) {
        setError('This account does not have vendor access.');
        await supabase.auth.signOut();
        return;
      }

      const { data: vendor } = await supabase
        .from('canteen_vendors')
        .select('id, name')
        .eq('user_id', data.user.id)
        .single();

      if (!vendor) {
        setError('No vendor account linked to this email. Please sign up first.');
        await supabase.auth.signOut();
        return;
      }

      setVendorId(vendor.id);
      setVendorName(vendor.name);
      toast({ title: `Welcome, ${vendor.name}! 🏪` });
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSignup = useCallback(async (email: string, password: string, shopName: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin + '/canteen/vendor' },
      });
      if (authError) { setError('Could not create account. Please try again.'); return; }
      if (!authData.user) { setError('Could not create account. Please try again.'); return; }

      // Create vendor record via edge function (uses service role)
      const { data: linkData, error: linkError } = await supabase.functions.invoke('vendor-link', {
        body: { userId: authData.user.id, email, shopName },
      });

      if (linkError || linkData?.error) {
        setError(linkData?.error || 'Failed to create vendor account.');
        return;
      }

      setVendorId(linkData.vendorId);
      setVendorName(linkData.vendorName);
      toast({ title: `Welcome, ${linkData.vendorName}! 🏪`, description: 'Your vendor account is ready.' });
    } catch {
      setError('Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    setVendorId(null);
    setVendorName('');
    setError(null);
  }, []);

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-orange-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (vendorId) {
    return (
      <VendorDashboard
        vendorId={vendorId}
        vendorName={vendorName}
        onLogout={handleLogout}
        onBack={() => navigate('/')}
      />
    );
  }

  return (
    <VendorLogin
      onLogin={handleLogin}
      onSignup={handleSignup}
      onLoginSuccess={() => {}}
      onBack={() => navigate(-1)}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default VendorDashboardPage;
