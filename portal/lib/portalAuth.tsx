import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export type PortalProfileState = {
  role: string | null;
  missing: boolean;
};

export function usePortalAuth() {
  const [session, setSession] = useState<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null>(
    null
  );
  const [profile, setProfile] = useState<PortalProfileState>({ role: null, missing: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async (userId: string | undefined) => {
    if (!userId) {
      setProfile({ role: null, missing: false });
      return;
    }

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      setError(profileError.message);
      setProfile({ role: null, missing: false });
      return;
    }

    if (!data) {
      setProfile({ role: null, missing: true });
      return;
    }

    setProfile({ role: data.role ?? null, missing: false });
  }, []);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!isMounted) return;
      if (sessionError) {
        setError(sessionError.message);
      }
      setSession(data.session ?? null);
      await loadProfile(data.session?.user.id);
      setLoading(false);
    };

    init();

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      await loadProfile(nextSession?.user.id);
    });

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
    setLoading(false);
  }, []);

  return {
    session,
    profile,
    loading,
    error,
    signOut,
    refreshProfile: loadProfile,
  };
}
