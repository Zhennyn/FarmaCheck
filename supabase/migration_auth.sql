-- Adiciona campos à tabela profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Trigger: cria perfil automaticamente ao registrar usuário
CREATE OR REPLACE FUNCTION handle_new_user()
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
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Usuário pode ler próprio perfil (para checar status)
DROP POLICY IF EXISTS "profiles: user reads own" ON profiles;
CREATE POLICY "profiles: user reads own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Gerente lê todos os perfis
DROP POLICY IF EXISTS "profiles: gerente reads all" ON profiles;
CREATE POLICY "profiles: gerente reads all"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'gerente' AND p.status = 'approved'
    )
  );

-- Gerente atualiza status de qualquer perfil
DROP POLICY IF EXISTS "profiles: gerente update status" ON profiles;
CREATE POLICY "profiles: gerente update status"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'gerente' AND p.status = 'approved'
    )
  );
