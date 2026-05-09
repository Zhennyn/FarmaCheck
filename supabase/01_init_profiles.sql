-- 1. Cria a tabela profiles caso ela não exista
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  role text DEFAULT 'funcionario',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz DEFAULT now()
);

-- 2. Habilita a Segurança em Nível de Linha (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Cria a função auxiliar para verificar se é gerente
CREATE OR REPLACE FUNCTION public.is_gerente()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'gerente' AND status = 'approved'
  );
$$;

-- 4. Cria as políticas de segurança corretas
DROP POLICY IF EXISTS "profiles: user reads own" ON profiles;
CREATE POLICY "profiles: user reads own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles: gerente reads all" ON profiles;
CREATE POLICY "profiles: gerente reads all"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR public.is_gerente());

DROP POLICY IF EXISTS "profiles: gerente update status" ON profiles;
CREATE POLICY "profiles: gerente update status"
  ON profiles FOR UPDATE
  USING (id = auth.uid() OR public.is_gerente());

-- 5. Trigger para criar perfil automaticamente quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email, status)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'role', 'funcionario'),
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário'),
    new.email,
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Força a API do Supabase a recarregar o cache das tabelas (MUITO IMPORTANTE)
NOTIFY pgrst, 'reload schema';
