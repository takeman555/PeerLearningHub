# Manual Database Setup Guide

Since the `exec_sql` function doesn't exist yet, you need to run the following SQL commands manually in the Supabase SQL Editor.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Create a new query

## Step 2: Run the Complete Setup SQL

Copy and paste the following SQL into the Supabase SQL Editor and execute it:

```sql
-- ============================================================================
-- COMPLETE DATABASE SETUP FOR PEER LEARNING HUB
-- ============================================================================

-- Step 1: Create exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN 'SQL executed successfully';
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error: ' || SQLERRM;
END;
$$;

-- Grant execute permission ONLY to authenticated users (SECURITY FIX)
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Step 2: Create migrations tracking table
CREATE TABLE IF NOT EXISTS public._migrations (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions on migrations table (SECURITY FIX)
GRANT SELECT ON TABLE public._migrations TO authenticated;
GRANT SELECT ON TABLE public._migrations TO anon;
GRANT USAGE, SELECT ON SEQUENCE public._migrations_id_seq TO authenticated;

-- Step 3: Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  avatar_url TEXT,
  country TEXT,
  bio TEXT,
  skills TEXT[],
  languages TEXT[],
  timezone TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  social_links JSONB,
  preferences JSONB,
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Grant permissions on profiles
GRANT ALL ON TABLE public.profiles TO authenticated;
GRANT SELECT ON TABLE public.profiles TO anon;

-- Step 3.5: Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
DROP POLICY IF EXISTS "User roles are viewable by everyone" ON public.user_roles;
CREATE POLICY "User roles are viewable by everyone" ON public.user_roles
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can manage user roles" ON public.user_roles;
CREATE POLICY "Only admins can manage user roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true 
      AND p.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.profiles p ON ur.user_id = p.id
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true 
      AND p.is_active = true
    )
  );

-- Grant permissions on user_roles
GRANT ALL ON TABLE public.user_roles TO authenticated;
GRANT SELECT ON TABLE public.user_roles TO anon;

-- Create function to handle updated_at timestamp
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles updated_at
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 4: Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  external_link TEXT,
  member_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Create policies for groups
DROP POLICY IF EXISTS "Groups are viewable by everyone" ON public.groups;
CREATE POLICY "Groups are viewable by everyone" ON public.groups
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can create groups" ON public.groups;
CREATE POLICY "Admins can create groups" ON public.groups
  FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can update groups" ON public.groups;
CREATE POLICY "Admins can update groups" ON public.groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can delete groups" ON public.groups;
CREATE POLICY "Admins can delete groups" ON public.groups
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Grant permissions on groups
GRANT ALL ON TABLE public.groups TO authenticated;
GRANT SELECT ON TABLE public.groups TO anon;

-- Step 5: Create posts table (SCHEMA FIX - add missing columns)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT posts_content_length CHECK (char_length(content) >= 1 AND char_length(content) <= 5000)
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create policies for posts
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
CREATE POLICY "Posts are viewable by everyone" ON public.posts
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions on posts
GRANT ALL ON TABLE public.posts TO authenticated;
GRANT SELECT ON TABLE public.posts TO anon;

-- Step 6: Create post_likes table
CREATE TABLE IF NOT EXISTS public.post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Enable RLS on post_likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for post_likes
DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON public.post_likes;
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;
CREATE POLICY "Users can unlike posts" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Grant permissions on post_likes
GRANT ALL ON TABLE public.post_likes TO authenticated;
GRANT SELECT ON TABLE public.post_likes TO anon;

-- Create function to update post likes count (FUNCTIONALITY FIX)
CREATE OR REPLACE FUNCTION public.update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for likes count updates
CREATE TRIGGER update_post_likes_count_trigger
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_post_likes_count();

-- Step 7: Create initial test profiles (FOREIGN KEY FIX)
-- NOTE: These profiles will only work if you manually create corresponding auth.users first
-- For production, use the handle_new_user() trigger instead

-- Create a function to safely create test profiles
CREATE OR REPLACE FUNCTION create_test_profiles()
RETURNS TEXT AS $$
DECLARE
  admin_auth_id UUID;
  member_auth_id UUID;
  result_text TEXT := '';
BEGIN
  -- Check if we have any auth users to work with
  SELECT id INTO admin_auth_id FROM auth.users LIMIT 1;
  
  IF admin_auth_id IS NULL THEN
    RETURN 'No auth.users found. Please sign up through the app first, then run this function.';
  END IF;
  
  -- Use the first available auth user as admin
  INSERT INTO public.profiles (id, full_name, email, is_active)
  VALUES (
    admin_auth_id,
    'Admin User',
    (SELECT email FROM auth.users WHERE id = admin_auth_id),
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = 'Admin User',
    is_active = true;
  
  -- Assign admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (admin_auth_id, 'admin')
  ON CONFLICT (user_id, role) DO UPDATE SET
    is_active = true;
  
  result_text := 'Admin profile created for user: ' || admin_auth_id::text;
  
  -- Try to find a second auth user for member
  SELECT id INTO member_auth_id FROM auth.users WHERE id != admin_auth_id LIMIT 1;
  
  IF member_auth_id IS NOT NULL THEN
    INSERT INTO public.profiles (id, full_name, email, is_active)
    VALUES (
      member_auth_id,
      'Test Member',
      (SELECT email FROM auth.users WHERE id = member_auth_id),
      true
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = 'Test Member',
      is_active = true;
    
    -- Assign user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (member_auth_id, 'user')
    ON CONFLICT (user_id, role) DO UPDATE SET
      is_active = true;
    
    result_text := result_text || ', Member profile created for user: ' || member_auth_id::text;
  ELSE
    result_text := result_text || ', No second auth user found for member profile';
  END IF;
  
  RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create test profiles
SELECT create_test_profiles();

-- Step 9: Create initial groups (FOREIGN KEY FIX)
CREATE OR REPLACE FUNCTION create_initial_groups()
RETURNS TEXT AS $$
DECLARE
  admin_user_id UUID;
  result_text TEXT := '';
BEGIN
  -- Get the admin user ID
  SELECT p.id INTO admin_user_id 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'admin' AND ur.is_active = true AND p.is_active = true
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RETURN 'No admin user found. Please create admin profile first.';
  END IF;

  -- Insert initial groups
  INSERT INTO public.groups (name, description, external_link, created_by, member_count)
  VALUES 
    ('ピアラーニングハブ生成AI部', '生成AI技術について学び、実践的なプロジェクトに取り組むコミュニティです。ChatGPT、Claude、Midjourney等の最新AI技術を活用した学習とディスカッションを行います。', 'https://discord.gg/ai-learning-hub', admin_user_id, 0),
    ('さぬきピアラーニングハブゴルフ部', '香川県内でゴルフを楽しみながら、ネットワーキングと学習を組み合わせたユニークなコミュニティです。初心者から上級者まで歓迎します。', 'https://discord.gg/sanuki-golf-club', admin_user_id, 0),
    ('さぬきピアラーニングハブ英語部', '英語学習を通じて国際的な視野を広げるコミュニティです。英会話練習、TOEIC対策、ビジネス英語など様々な学習活動を行います。', 'https://discord.gg/sanuki-english-club', admin_user_id, 0),
    ('WAOJEさぬきピアラーニングハブ交流会参加者', 'WAOJE（和僑会）との連携による国際的なビジネス交流会の参加者コミュニティです。グローバルなビジネスネットワーキングと学習機会を提供します。', 'https://discord.gg/waoje-sanuki-exchange', admin_user_id, 0),
    ('香川イノベーションベース', '香川県を拠点とした起業家、イノベーター、クリエイターのためのコミュニティです。新しいビジネスアイデアの創出と実現をサポートします。', 'https://discord.gg/kagawa-innovation-base', admin_user_id, 0),
    ('さぬきピアラーニングハブ居住者', 'さぬきピアラーニングハブの居住者専用コミュニティです。共同生活を通じた学習体験と日常的な情報共有を行います。', 'https://discord.gg/sanuki-residents', admin_user_id, 0),
    ('英語キャンプ卒業者', '英語キャンプを修了したメンバーのアルムナイコミュニティです。継続的な英語学習サポートと卒業生同士のネットワーキングを提供します。', 'https://discord.gg/english-camp-alumni', admin_user_id, 0)
  ON CONFLICT (name) DO NOTHING;
  
  RETURN 'Initial groups created successfully by admin user: ' || admin_user_id::text;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to create initial groups
SELECT create_initial_groups();

-- Step 10: Reload schema cache
NOTIFY pgrst, 'reload schema';

-- Step 11: Verification queries (run these to check if everything worked)
SELECT 'Profiles table' as table_name, count(*) as record_count FROM public.profiles
UNION ALL
SELECT 'User roles table' as table_name, count(*) as record_count FROM public.user_roles
UNION ALL
SELECT 'Groups table' as table_name, count(*) as record_count FROM public.groups
UNION ALL
SELECT 'Posts table' as table_name, count(*) as record_count FROM public.posts
UNION ALL
SELECT 'Post likes table' as table_name, count(*) as record_count FROM public.post_likes;

-- Show created groups
SELECT name, description, external_link, is_active FROM public.groups ORDER BY created_at;
```

## Step 3: Verify the Setup

After running the SQL, you should see:
- A verification table showing record counts for each table
- A list of the 7 created groups with their details

## Step 4: Test the Application

1. Restart your development server: `npm start`
2. Navigate to the Community tab in the app
3. Check that:
   - Groups tab shows the 7 created groups
   - Each group has proper descriptions and external links
   - Posts tab is accessible (even if empty)
   - Members tab is accessible

## Troubleshooting

If you encounter issues:

1. **Foreign key constraint errors**: 
   - First sign up through the app to create auth.users
   - Then run `SELECT create_test_profiles();` to create profiles
   - Finally run `SELECT create_initial_groups();` to create groups

2. **Schema cache problems**: Run this in SQL Editor:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. **Permission errors**: Ensure RLS policies are created correctly

4. **Missing columns errors**: 
   - Check that posts table has `likes_count` and `comments_count` columns
   - Verify triggers are created for counter updates

5. **App still shows errors**: Restart the development server and clear any caches

## Security Notes

- `exec_sql` function is only available to authenticated users (not anonymous)
- `_migrations` table has read-only access for anonymous users
- All RLS policies include proper WITH CHECK clauses to prevent unauthorized data insertion
- Test profiles use actual auth.users IDs to maintain referential integrity

## Next Steps

Once the manual setup is complete, you can use the automated scripts:

```bash
# Check groups status
npm run check:initial-groups

# Validate setup
npm run validate:initial-groups

# Test group display
npm run test:group-display
```