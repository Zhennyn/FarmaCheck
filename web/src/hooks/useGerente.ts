import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { User } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase';

interface GerenteState {
  user: User | null;
  role: string | null;
  signOut: () => Promise<void>;
}

const useGerente = (): GerenteState => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const boot = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.replace('/(tabs)' as never); return; }

        const { data: profile } = await supabase
          .from('profiles')
          .select('role, name')
          .eq('id', session.user.id)
          .single();

        if (!profile || profile.role !== 'gerente') {
          await supabase.auth.signOut();
          router.replace('/(tabs)' as never);
          return;
        }

        setUser(session.user);
        setRole(profile.role as string);
      } catch (error: unknown) {
        console.error('useGerente boot error:', error);
        router.replace('/(tabs)' as never);
      }
    };

    boot();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null);
        setRole(null);
        router.replace('/(tabs)' as never);
      }
    });

    return () => { listener.subscription.unsubscribe(); };
  }, [router]);

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    try {
      await supabase.auth.signOut();
      setUser(null);
      setRole(null);
      router.replace('/(tabs)' as never);
    } catch (error: unknown) {
      console.error('signOut error:', error);
    }
  }, [router]);

  return { user, role, signOut };
};

export default useGerente;

