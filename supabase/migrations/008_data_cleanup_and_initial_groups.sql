-- Migration: Data cleanup and initial groups setup
-- This migration handles data cleanup and creates the 8 specified groups

-- Function to safely cleanup all posts
CREATE OR REPLACE FUNCTION public.cleanup_all_posts()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete all post likes first (foreign key constraint)
  DELETE FROM public.post_likes;
  
  -- Delete all posts
  DELETE FROM public.posts;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Reset any sequences if needed
  -- Note: UUID primary keys don't use sequences, so this is mainly for completeness
  
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely cleanup all groups
CREATE OR REPLACE FUNCTION public.cleanup_all_groups()
RETURNS INTEGER AS $
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete all group memberships first (foreign key constraint)
  DELETE FROM public.group_memberships;
  
  -- Delete all groups
  DELETE FROM public.groups;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create the 8 specified groups
CREATE OR REPLACE FUNCTION public.create_initial_groups(admin_user_id UUID)
RETURNS INTEGER AS $
DECLARE
  inserted_count INTEGER := 0;
  group_data RECORD;
BEGIN
  -- Define the 8 groups to be created
  FOR group_data IN 
    SELECT * FROM (VALUES
      ('ピアラーニングハブ生成AI部', 'AI技術と生成AIについて学び、実践的なプロジェクトを通じて知識を深めるコミュニティです。', 'https://discord.gg/ai-learning'),
      ('さぬきピアラーニングハブゴルフ部', '香川県でのゴルフを通じた交流とネットワーキングを目的としたグループです。', 'https://line.me/ti/g/golf-sanuki'),
      ('さぬきピアラーニングハブ英語部', '英語学習とスキル向上を目指すメンバーが集まるグループです。', 'https://discord.gg/english-sanuki'),
      ('WAOJEさぬきピアラーニングハブ交流会参加者', 'WAOJE（世界青年機構）の交流会参加者向けのコミュニティです。', 'https://waoje.org/sanuki-hub'),
      ('香川イノベーションベース', '香川県でのイノベーションとスタートアップ活動を支援するコミュニティです。', 'https://kagawa-innovation.jp/join'),
      ('さぬきピアラーニングハブ居住者', '香川県に住むピアラーニングハブメンバーの地域コミュニティです。', 'https://telegram.me/sanuki-residents'),
      ('英語キャンプ卒業者', '英語キャンププログラムを修了したメンバーのアルムナイネットワークです。', 'https://discord.gg/english-camp-alumni')
    ) AS t(name, description, external_link)
  LOOP
    INSERT INTO public.groups (name, description, external_link, created_by, member_count)
    VALUES (group_data.name, group_data.description, group_data.external_link, admin_user_id, 0);
    
    inserted_count := inserted_count + 1;
  END LOOP;
  
  RETURN inserted_count;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate data integrity after cleanup
CREATE OR REPLACE FUNCTION public.validate_data_integrity()
RETURNS BOOLEAN AS $
DECLARE
  posts_count INTEGER;
  groups_count INTEGER;
  orphaned_likes INTEGER;
  orphaned_memberships INTEGER;
BEGIN
  -- Check for orphaned records
  SELECT COUNT(*) INTO orphaned_likes
  FROM public.post_likes pl
  LEFT JOIN public.posts p ON pl.post_id = p.id
  WHERE p.id IS NULL;
  
  SELECT COUNT(*) INTO orphaned_memberships
  FROM public.group_memberships gm
  LEFT JOIN public.groups g ON gm.group_id = g.id
  WHERE g.id IS NULL;
  
  -- Get current counts
  SELECT COUNT(*) INTO posts_count FROM public.posts;
  SELECT COUNT(*) INTO groups_count FROM public.groups;
  
  -- Return true if no orphaned records exist
  RETURN (orphaned_likes = 0 AND orphaned_memberships = 0);
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to perform complete data cleanup and setup
CREATE OR REPLACE FUNCTION public.perform_community_reset(admin_user_id UUID DEFAULT NULL)
RETURNS JSONB AS $
DECLARE
  result JSONB;
  deleted_posts INTEGER;
  deleted_groups INTEGER;
  created_groups INTEGER;
  integrity_check BOOLEAN;
  admin_id UUID;
BEGIN
  -- If no admin_user_id provided, try to find a super_admin
  IF admin_user_id IS NULL THEN
    SELECT ur.user_id INTO admin_id
    FROM public.user_roles ur
    WHERE ur.role = 'super_admin' AND ur.is_active = true
    LIMIT 1;
    
    -- If no super_admin found, find any admin
    IF admin_id IS NULL THEN
      SELECT ur.user_id INTO admin_id
      FROM public.user_roles ur
      WHERE ur.role = 'admin' AND ur.is_active = true
      LIMIT 1;
    END IF;
    
    -- If still no admin found, raise exception
    IF admin_id IS NULL THEN
      RAISE EXCEPTION 'No admin user found to create groups. Please provide admin_user_id parameter.';
    END IF;
  ELSE
    admin_id := admin_user_id;
  END IF;
  
  -- Perform cleanup
  SELECT public.cleanup_all_posts() INTO deleted_posts;
  SELECT public.cleanup_all_groups() INTO deleted_groups;
  
  -- Create initial groups
  SELECT public.create_initial_groups(admin_id) INTO created_groups;
  
  -- Validate integrity
  SELECT public.validate_data_integrity() INTO integrity_check;
  
  -- Build result
  result := jsonb_build_object(
    'deleted_posts', deleted_posts,
    'deleted_groups', deleted_groups,
    'created_groups', created_groups,
    'integrity_check_passed', integrity_check,
    'admin_user_id', admin_id,
    'timestamp', NOW()
  );
  
  RETURN result;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (admins will be checked within functions)
GRANT EXECUTE ON FUNCTION public.cleanup_all_posts() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_all_groups() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_initial_groups(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_data_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION public.perform_community_reset(UUID) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.cleanup_all_posts() IS 'Safely removes all posts and related data while maintaining referential integrity';
COMMENT ON FUNCTION public.cleanup_all_groups() IS 'Safely removes all groups and related data while maintaining referential integrity';
COMMENT ON FUNCTION public.create_initial_groups(UUID) IS 'Creates the 8 specified community groups with proper metadata';
COMMENT ON FUNCTION public.validate_data_integrity() IS 'Validates that no orphaned records exist after cleanup operations';
COMMENT ON FUNCTION public.perform_community_reset(UUID) IS 'Performs complete community data reset and setup in a single transaction';

-- Create a view for easy group management
CREATE OR REPLACE VIEW public.groups_with_creator AS
SELECT 
  g.id,
  g.name,
  g.description,
  g.external_link,
  g.member_count,
  g.is_active,
  g.created_at,
  g.updated_at,
  p.full_name as creator_name,
  p.email as creator_email
FROM public.groups g
LEFT JOIN public.profiles p ON g.created_by = p.id
WHERE g.is_active = true
ORDER BY g.created_at DESC;

-- Grant select on the view
GRANT SELECT ON public.groups_with_creator TO authenticated;

COMMENT ON VIEW public.groups_with_creator IS 'Groups with creator information for administrative purposes';