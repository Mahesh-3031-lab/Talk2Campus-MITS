import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'student' | 'vendor' | 'admin';

/**
 * Returns the signed-in user's roles (server-verified via user_roles + RLS).
 * `null` while loading; `[]` if signed out or no roles assigned.
 */
export function useUserRole() {
  const [roles, setRoles] = useState<AppRole[] | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async (uid: string | null) => {
      if (!uid) {
        if (active) { setUserId(null); setRoles([]); }
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', uid);
      if (!active) return;
      setUserId(uid);
      setRoles(((data || []).map(r => r.role)) as AppRole[]);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      load(session?.user?.id ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session?.user?.id ?? null);
    });

    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  return {
    userId,
    roles,
    loading: roles === null,
    isVendor: roles?.includes('vendor') ?? false,
    isStudent: roles?.includes('student') ?? false,
    isAdmin: roles?.includes('admin') ?? false,
    hasRole: (r: AppRole) => roles?.includes(r) ?? false,
  };
}
