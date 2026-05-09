import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase';

type Role = 'funcionario' | 'gerente';

interface AuthState {
  user: User | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const fetchRole = async (userId: string): Promise<Role | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data.role as Role;
};

const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setRole(null);
      return;
    }
    setUser(session.user);
    const r = await fetchRole(session.user.id);
    setRole(r);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data }) => {
      await hydrate(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
      await hydrate(session);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [hydrate]);

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return { user, role, loading, signIn, signOut };
};

export default useAuth;
