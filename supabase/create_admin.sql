-- ATENÇÃO: Rode este código no SQL Editor do Supabase para forçar a criação do Gerente

-- 1. Cria o usuário no Auth (bypassa a restrição de signup pelo JS)
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'Drogaria874@farmacheck.com',
  crypt('Drogaria@10', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Gerente Drogaria"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- 2. Atualiza o perfil correspondente (criado automaticamente pela trigger) para ser gerente e aprovado
UPDATE public.profiles
SET role = 'gerente', status = 'approved'
WHERE email = 'Drogaria874@farmacheck.com';
