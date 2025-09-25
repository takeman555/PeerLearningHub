-- Production Security Setup Migration
-- This migration sets up additional security measures for production

-- Create exec_sql function if it doesn't exist (for running migrations)
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Create enhanced RLS policies for production

-- Profiles policies
DROP POLICY IF EXISTS profiles_select_policy ON profiles;
CREATE POLICY profiles_select_policy ON profiles
FOR SELECT
USING (
  auth.uid() = id OR 
  has_any_role(ARRAY['admin', 'moderator']) OR
  (is_active = true AND is_verified = true)
);

DROP POLICY IF EXISTS profiles_insert_policy ON profiles;
CREATE POLICY profiles_insert_policy ON profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_policy ON profiles;
CREATE POLICY profiles_update_policy ON profiles
FOR UPDATE
USING (
  auth.uid() = id OR 
  has_any_role(ARRAY['admin', 'moderator'])
);

DROP POLICY IF EXISTS profiles_delete_policy ON profiles;
CREATE POLICY profiles_delete_policy ON profiles
FOR DELETE
USING (
  auth.uid() = id OR 
  has_any_role(ARRAY['admin', 'super_admin'])
);

-- User roles policies
DROP POLICY IF EXISTS user_roles_select_policy ON user_roles;
CREATE POLICY user_roles_select_policy ON user_roles
FOR SELECT
USING (
  auth.uid() = user_id OR 
  has_any_role(ARRAY['admin', 'super_admin'])
);

DROP POLICY IF EXISTS user_roles_insert_policy ON user_roles;
CREATE POLICY user_roles_insert_policy ON user_roles
FOR INSERT
WITH CHECK (has_any_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS user_roles_update_policy ON user_roles;
CREATE POLICY user_roles_update_policy ON user_roles
FOR UPDATE
USING (has_any_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS user_roles_delete_policy ON user_roles;
CREATE POLICY user_roles_delete_policy ON user_roles
FOR DELETE
USING (has_any_role(ARRAY['super_admin']));

-- Posts policies
DROP POLICY IF EXISTS posts_select_policy ON posts;
CREATE POLICY posts_select_policy ON posts
FOR SELECT
USING (
  is_published = true OR 
  author_id = auth.uid() OR 
  has_any_role(ARRAY['admin', 'moderator'])
);

DROP POLICY IF EXISTS posts_insert_policy ON posts;
CREATE POLICY posts_insert_policy ON posts
FOR INSERT
WITH CHECK (
  author_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_active = true 
    AND is_verified = true
  )
);

DROP POLICY IF EXISTS posts_update_policy ON posts;
CREATE POLICY posts_update_policy ON posts
FOR UPDATE
USING (
  author_id = auth.uid() OR 
  has_any_role(ARRAY['admin', 'moderator'])
);

DROP POLICY IF EXISTS posts_delete_policy ON posts;
CREATE POLICY posts_delete_policy ON posts
FOR DELETE
USING (
  author_id = auth.uid() OR 
  has_any_role(ARRAY['admin', 'moderator'])
);

-- Groups policies
DROP POLICY IF EXISTS groups_select_policy ON groups;
CREATE POLICY groups_select_policy ON groups
FOR SELECT
USING (
  is_active = true OR 
  created_by = auth.uid() OR 
  has_any_role(ARRAY['admin', 'moderator'])
);

DROP POLICY IF EXISTS groups_insert_policy ON groups;
CREATE POLICY groups_insert_policy ON groups
FOR INSERT
WITH CHECK (
  created_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND is_active = true 
    AND is_verified = true
  )
);

DROP POLICY IF EXISTS groups_update_policy ON groups;
CREATE POLICY groups_update_policy ON groups
FOR UPDATE
USING (
  created_by = auth.uid() OR 
  has_any_role(ARRAY['admin', 'moderator'])
);

DROP POLICY IF EXISTS groups_delete_policy ON groups;
CREATE POLICY groups_delete_policy ON groups
FOR DELETE
USING (
  created_by = auth.uid() OR 
  has_any_role(ARRAY['admin', 'super_admin'])
);

-- Announcements policies (admin only)
DROP POLICY IF EXISTS announcements_select_policy ON announcements;
CREATE POLICY announcements_select_policy ON announcements
FOR SELECT
USING (
  is_published = true OR 
  has_any_role(ARRAY['admin', 'moderator'])
);

DROP POLICY IF EXISTS announcements_insert_policy ON announcements;
CREATE POLICY announcements_insert_policy ON announcements
FOR INSERT
WITH CHECK (has_any_role(ARRAY['admin', 'moderator']));

DROP POLICY IF EXISTS announcements_update_policy ON announcements;
CREATE POLICY announcements_update_policy ON announcements
FOR UPDATE
USING (has_any_role(ARRAY['admin', 'moderator']));

DROP POLICY IF EXISTS announcements_delete_policy ON announcements;
CREATE POLICY announcements_delete_policy ON announcements
FOR DELETE
USING (has_any_role(ARRAY['admin', 'super_admin']));

-- Memberships policies
DROP POLICY IF EXISTS memberships_select_policy ON memberships;
CREATE POLICY memberships_select_policy ON memberships
FOR SELECT
USING (
  user_id = auth.uid() OR 
  has_any_role(ARRAY['admin', 'super_admin'])
);

DROP POLICY IF EXISTS memberships_insert_policy ON memberships;
CREATE POLICY memberships_insert_policy ON memberships
FOR INSERT
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS memberships_update_policy ON memberships;
CREATE POLICY memberships_update_policy ON memberships
FOR UPDATE
USING (
  user_id = auth.uid() OR 
  has_any_role(ARRAY['admin', 'super_admin'])
);

-- Create security audit log table
CREATE TABLE IF NOT EXISTS security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- Audit log policies (admin only)
CREATE POLICY security_audit_log_select_policy ON security_audit_log
FOR SELECT
USING (has_any_role(ARRAY['admin', 'super_admin']));

CREATE POLICY security_audit_log_insert_policy ON security_audit_log
FOR INSERT
WITH CHECK (true); -- Allow system to insert audit logs

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO security_audit_log (
    user_id,
    action,
    resource_type,
    resource_id,
    success,
    error_message,
    metadata
  ) VALUES (
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_success,
    p_error_message,
    p_metadata
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON security_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_action ON security_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_resource_type ON security_audit_log(resource_type);

-- Create function to check rate limits
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_action TEXT,
  p_limit INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO request_count
  FROM security_audit_log
  WHERE user_id = auth.uid()
    AND action = p_action
    AND created_at > NOW() - INTERVAL '1 minute' * p_window_minutes;
  
  RETURN request_count < p_limit;
END;
$$;

-- Create trigger to automatically log certain actions
CREATE OR REPLACE FUNCTION trigger_security_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log profile updates
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE' THEN
    PERFORM log_security_event(
      'profile_update',
      'profile',
      NEW.id::TEXT,
      true,
      NULL,
      jsonb_build_object('updated_fields', 
        (SELECT jsonb_object_agg(key, value) 
         FROM jsonb_each(to_jsonb(NEW)) 
         WHERE key != 'updated_at' AND to_jsonb(NEW)->>key != to_jsonb(OLD)->>key)
      )
    );
  END IF;
  
  -- Log role changes
  IF TG_TABLE_NAME = 'user_roles' THEN
    PERFORM log_security_event(
      CASE TG_OP 
        WHEN 'INSERT' THEN 'role_granted'
        WHEN 'UPDATE' THEN 'role_updated'
        WHEN 'DELETE' THEN 'role_revoked'
      END,
      'user_role',
      COALESCE(NEW.id, OLD.id)::TEXT,
      true,
      NULL,
      jsonb_build_object(
        'user_id', COALESCE(NEW.user_id, OLD.user_id),
        'role', COALESCE(NEW.role, OLD.role),
        'operation', TG_OP
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS profiles_audit_trigger ON profiles;
CREATE TRIGGER profiles_audit_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_security_audit();

DROP TRIGGER IF EXISTS user_roles_audit_trigger ON user_roles;
CREATE TRIGGER user_roles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_roles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_security_audit();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Revoke dangerous permissions from anon role
REVOKE ALL ON security_audit_log FROM anon;
REVOKE EXECUTE ON FUNCTION exec_sql(text) FROM anon;

COMMENT ON TABLE security_audit_log IS 'Audit log for security-related events in production';
COMMENT ON FUNCTION log_security_event IS 'Function to log security events for audit purposes';
COMMENT ON FUNCTION check_rate_limit IS 'Function to check if user has exceeded rate limits';
COMMENT ON FUNCTION trigger_security_audit IS 'Trigger function to automatically log security events';