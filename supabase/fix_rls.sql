-- Resolve o problema de "Infinite Recursion" nas políticas de RLS

-- 1. Cria uma função que ignora o RLS (Security Definer) para verificar se o usuário é gerente
CREATE OR REPLACE FUNCTION public.is_gerente()
RETURNS boolean
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'gerente' AND status = 'approved'
  );
$$;

-- 2. Recria a política de SELECT usando a função
DROP POLICY IF EXISTS "profiles: gerente reads all" ON profiles;
CREATE POLICY "profiles: gerente reads all"
  ON profiles FOR SELECT
  USING (
    id = auth.uid() OR public.is_gerente()
  );

-- 3. Recria a política de UPDATE usando a função
DROP POLICY IF EXISTS "profiles: gerente update status" ON profiles;
CREATE POLICY "profiles: gerente update status"
  ON profiles FOR UPDATE
  USING (
    id = auth.uid() OR public.is_gerente()
  );
