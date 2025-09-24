-- Migration: Add mock users for development and testing
-- This migration creates test users that match the mock authentication service

-- First, let's create the test users in auth.users table
-- Note: In production, users would be created through the signup process
-- This is for development/testing purposes only

-- Insert test users into auth.users (this requires service role key)
-- These users will have confirmed emails and can be used for testing

-- Regular Members
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES 
-- Member 1: 田中 太郎
(
  'mock-user-member1@example.com',
  '00000000-0000-0000-0000-000000000000',
  'member1@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "田中 太郎", "country": "Japan", "role": "member"}',
  false,
  'authenticated'
),
-- Member 2: Sarah Johnson
(
  'mock-user-member2@example.com',
  '00000000-0000-0000-0000-000000000000',
  'member2@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Sarah Johnson", "country": "USA", "role": "member"}',
  false,
  'authenticated'
),
-- Member 3: Kim Min-jun
(
  'mock-user-member3@example.com',
  '00000000-0000-0000-0000-000000000000',
  'member3@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Kim Min-jun", "country": "South Korea", "role": "member"}',
  false,
  'authenticated'
),
-- Admin 1: 管理者 一郎
(
  'mock-user-admin@peerlearning.com',
  '00000000-0000-0000-0000-000000000000',
  'admin@peerlearning.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "管理者 一郎", "country": "Japan", "role": "admin"}',
  false,
  'authenticated'
),
-- Admin 2: Tizuka Admin
(
  'mock-user-tizuka0@gmail.com',
  '00000000-0000-0000-0000-000000000000',
  'tizuka0@gmail.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Tizuka Admin", "country": "Japan", "role": "admin"}',
  false,
  'authenticated'
),
-- Super Admin: Developer User
(
  'mock-user-dev@peerlearning.com',
  '00000000-0000-0000-0000-000000000000',
  'dev@peerlearning.com',
  crypt('devpassword123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Developer User", "country": "Japan", "role": "super_admin"}',
  false,
  'authenticated'
)
ON CONFLICT (email) DO NOTHING;

-- Now create corresponding profiles for these users
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  country,
  bio,
  skills,
  is_verified,
  is_active,
  created_at,
  updated_at
) VALUES 
-- Member 1: 田中 太郎
(
  'mock-user-member1@example.com',
  'member1@example.com',
  '田中 太郎',
  'Japan',
  '日本語を学習中の学生です。プログラミングにも興味があります。',
  ARRAY['言語学習', 'プログラミング', 'コミュニケーション'],
  true,
  true,
  NOW(),
  NOW()
),
-- Member 2: Sarah Johnson
(
  'mock-user-member2@example.com',
  'member2@example.com',
  'Sarah Johnson',
  'USA',
  'Digital nomad interested in Japanese culture and language learning.',
  ARRAY['言語学習', 'デジタルノマド', 'コミュニケーション'],
  true,
  true,
  NOW(),
  NOW()
),
-- Member 3: Kim Min-jun
(
  'mock-user-member3@example.com',
  'member3@example.com',
  'Kim Min-jun',
  'South Korea',
  '韓国からの留学生です。日本で働きたいと思っています。',
  ARRAY['言語学習', '就職活動', 'コミュニケーション'],
  true,
  true,
  NOW(),
  NOW()
),
-- Admin 1: 管理者 一郎
(
  'mock-user-admin@peerlearning.com',
  'admin@peerlearning.com',
  '管理者 一郎',
  'Japan',
  'ピアラーニングハブの管理者です。',
  ARRAY['管理', 'サポート', 'システム運用'],
  true,
  true,
  NOW(),
  NOW()
),
-- Admin 2: Tizuka Admin
(
  'mock-user-tizuka0@gmail.com',
  'tizuka0@gmail.com',
  'Tizuka Admin',
  'Japan',
  'システム開発者・管理者',
  ARRAY['システム開発', '管理', 'サポート'],
  true,
  true,
  NOW(),
  NOW()
),
-- Super Admin: Developer User
(
  'mock-user-dev@peerlearning.com',
  'dev@peerlearning.com',
  'Developer User',
  'Japan',
  'システム開発者・スーパー管理者',
  ARRAY['システム開発', 'データベース管理', 'セキュリティ'],
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  country = EXCLUDED.country,
  bio = EXCLUDED.bio,
  skills = EXCLUDED.skills,
  updated_at = NOW();

-- Create user roles for the test users
INSERT INTO public.user_roles (
  id,
  user_id,
  role,
  granted_by,
  granted_at,
  is_active
) VALUES 
-- Regular members get 'user' role
(
  gen_random_uuid(),
  'mock-user-member1@example.com',
  'user',
  'mock-user-dev@peerlearning.com',
  NOW(),
  true
),
(
  gen_random_uuid(),
  'mock-user-member2@example.com',
  'user',
  'mock-user-dev@peerlearning.com',
  NOW(),
  true
),
(
  gen_random_uuid(),
  'mock-user-member3@example.com',
  'user',
  'mock-user-dev@peerlearning.com',
  NOW(),
  true
),
-- Admins get 'admin' role
(
  gen_random_uuid(),
  'mock-user-admin@peerlearning.com',
  'admin',
  'mock-user-dev@peerlearning.com',
  NOW(),
  true
),
(
  gen_random_uuid(),
  'mock-user-tizuka0@gmail.com',
  'admin',
  'mock-user-dev@peerlearning.com',
  NOW(),
  true
),
-- Super admin gets 'super_admin' role
(
  gen_random_uuid(),
  'mock-user-dev@peerlearning.com',
  'super_admin',
  'mock-user-dev@peerlearning.com',
  NOW(),
  true
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Add some sample data for testing
COMMENT ON TABLE public.profiles IS 'User profiles with mock test data for development';
COMMENT ON TABLE public.user_roles IS 'User roles with mock test data for development';

-- Log the creation of mock users
DO $$
BEGIN
  RAISE NOTICE 'Mock users created successfully:';
  RAISE NOTICE '- member1@example.com (password: password123) - Regular Member';
  RAISE NOTICE '- member2@example.com (password: password123) - Regular Member';
  RAISE NOTICE '- member3@example.com (password: password123) - Regular Member';
  RAISE NOTICE '- admin@peerlearning.com (password: admin123) - Administrator';
  RAISE NOTICE '- tizuka0@gmail.com (password: password123) - Administrator';
  RAISE NOTICE '- dev@peerlearning.com (password: devpassword123) - Super Administrator';
END $$;