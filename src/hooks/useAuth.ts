import { useState, useEffect, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/src/lib/supabase';

type Role = 'funcionario' | 'gerente';

interface Profile {
  id: string;
  role: Role;
  name: string;
  drugstore_number: string | null;
  regional: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const ensureProfile = async (user: User): Promise<Profile> => {
  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('profiles')
    .select('id, role, name, drugstore_number, regional')
    .eq('id', user.id)
    .single();

  if (!fetchError && existing) {
    return existing as Profile;
  }

  const defaultName =
    user.user_metadata?.name ??
    user.email?.split('@')[0] ??
    'Usuário';

  const { data: created, error: insertError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      role: 'funcionario',
      name: defaultName,
      drugstore_number: null,
      regional: null,
    })
    .select('id, role, name, drugstore_number, regional')
    .single();

  if (insertError || !created) {
    throw new Error(`Falha ao criar perfil: ${insertError?.message ?? 'desconhecido'}`);
  }

  return created as Profile;
};

const useAuth = (): AuthState => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async (session: Session | null) => {
    if (!session?.user) {
      setUser(null);
      setProfile(null);
      setRole(null);
      return;
    }

    setUser(session.user);

    try {
      const p = await ensureProfile(session.user);
      setProfile(p);
      setRole(p.role);
    } catch (err: unknown) {
      console.error('hydrate profile error:', err);
      setProfile(null);
      setRole(null);
    }
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

  return { user, profile, role, loading, signIn, signOut };
};

export default useAuth;
