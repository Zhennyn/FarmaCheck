import { useState, useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { createClient } from '@/src/lib/supabase';

export type ProfileStatus = 'loading' | 'unauthenticated' | 'pending' | 'rejected' | 'approved';

const useAuthGuard = (): { status: ProfileStatus } => {
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const supabase = createClient();

    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setStatus('unauthenticated');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('status')
          .eq('id', session.user.id)
          .single();

        setStatus((profile?.status as ProfileStatus) ?? 'pending');
      } catch (error: unknown) {
        console.error('Auth guard error:', error);
        setStatus('unauthenticated');
      }
    };

    check();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      check();
    });

    return () => { listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login' as never);
    } else if (status !== 'unauthenticated' && status !== 'loading' && inAuthGroup) {
      router.replace('/(tabs)' as never);
    }
  }, [status, segments, router]);

  return { status };
};

export default useAuthGuard;
