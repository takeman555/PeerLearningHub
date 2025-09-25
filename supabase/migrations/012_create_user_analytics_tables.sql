-- User Analytics Tables Migration
-- Creates tables for tracking user behavior, screen transitions, and conversion metrics

-- Create user_actions table for tracking user interactions
CREATE TABLE IF NOT EXISTS user_actions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    screen_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create screen_transitions table for tracking navigation patterns
CREATE TABLE IF NOT EXISTS screen_transitions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    from_screen VARCHAR(100),
    to_screen VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    duration INTEGER, -- Duration in milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create conversion_events table for tracking funnel conversions
CREATE TABLE IF NOT EXISTS conversion_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    funnel_step VARCHAR(100) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    value DECIMAL(10,2), -- Monetary value if applicable
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature_usage table for tracking feature usage patterns
CREATE TABLE IF NOT EXISTS feature_usage (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    usage_count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW(),
    total_time_spent INTEGER DEFAULT 0, -- Total time in milliseconds
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature_name)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_timestamp ON user_actions(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_screen_name ON user_actions(screen_name);

CREATE INDEX IF NOT EXISTS idx_screen_transitions_user_id ON screen_transitions(user_id);
CREATE INDEX IF NOT EXISTS idx_screen_transitions_timestamp ON screen_transitions(timestamp);
CREATE INDEX IF NOT EXISTS idx_screen_transitions_to_screen ON screen_transitions(to_screen);

CREATE INDEX IF NOT EXISTS idx_conversion_events_user_id ON conversion_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_events_timestamp ON conversion_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_events_event_type ON conversion_events(event_type);
CREATE INDEX IF NOT EXISTS idx_conversion_events_funnel_step ON conversion_events(funnel_step);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON feature_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature_name ON feature_usage(feature_name);
CREATE INDEX IF NOT EXISTS idx_feature_usage_last_used ON feature_usage(last_used);

-- Create composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_user_actions_user_timestamp ON user_actions(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_conversion_events_type_step ON conversion_events(event_type, funnel_step);

-- Enable Row Level Security (RLS)
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screen_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_actions
CREATE POLICY "Users can insert their own actions" ON user_actions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own actions" ON user_actions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all actions" ON user_actions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for screen_transitions
CREATE POLICY "Users can insert their own transitions" ON screen_transitions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own transitions" ON screen_transitions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transitions" ON screen_transitions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for conversion_events
CREATE POLICY "Users can insert their own conversions" ON conversion_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own conversions" ON conversion_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversions" ON conversion_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create RLS policies for feature_usage
CREATE POLICY "Users can insert their own feature usage" ON feature_usage
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature usage" ON feature_usage
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own feature usage" ON feature_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feature usage" ON feature_usage
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Create function to update feature_usage on conflict
CREATE OR REPLACE FUNCTION upsert_feature_usage(
    p_user_id UUID,
    p_feature_name VARCHAR(100),
    p_time_spent INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO feature_usage (user_id, feature_name, usage_count, last_used, total_time_spent)
    VALUES (p_user_id, p_feature_name, 1, NOW(), p_time_spent)
    ON CONFLICT (user_id, feature_name)
    DO UPDATE SET
        usage_count = feature_usage.usage_count + 1,
        last_used = NOW(),
        total_time_spent = feature_usage.total_time_spent + p_time_spent,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get conversion rates
CREATE OR REPLACE FUNCTION get_conversion_rates(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ,
    p_funnel_steps TEXT[]
) RETURNS TABLE(
    from_step TEXT,
    to_step TEXT,
    conversion_rate DECIMAL
) AS $$
DECLARE
    i INTEGER;
    current_step TEXT;
    next_step TEXT;
    current_count INTEGER;
    next_count INTEGER;
BEGIN
    FOR i IN 1..array_length(p_funnel_steps, 1) - 1 LOOP
        current_step := p_funnel_steps[i];
        next_step := p_funnel_steps[i + 1];
        
        -- Count users in current step
        SELECT COUNT(DISTINCT user_id) INTO current_count
        FROM conversion_events
        WHERE funnel_step = current_step
        AND timestamp BETWEEN p_start_date AND p_end_date;
        
        -- Count users in next step
        SELECT COUNT(DISTINCT user_id) INTO next_count
        FROM conversion_events
        WHERE funnel_step = next_step
        AND timestamp BETWEEN p_start_date AND p_end_date
        AND user_id IN (
            SELECT DISTINCT user_id
            FROM conversion_events
            WHERE funnel_step = current_step
            AND timestamp BETWEEN p_start_date AND p_end_date
        );
        
        -- Calculate conversion rate
        from_step := current_step;
        to_step := next_step;
        conversion_rate := CASE 
            WHEN current_count > 0 THEN (next_count::DECIMAL / current_count::DECIMAL) * 100
            ELSE 0
        END;
        
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get feature usage statistics
CREATE OR REPLACE FUNCTION get_feature_usage_stats(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
) RETURNS TABLE(
    feature_name TEXT,
    total_users BIGINT,
    total_usage BIGINT,
    average_time_spent DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fu.feature_name::TEXT,
        COUNT(DISTINCT fu.user_id) as total_users,
        SUM(fu.usage_count) as total_usage,
        CASE 
            WHEN SUM(fu.usage_count) > 0 THEN 
                SUM(fu.total_time_spent)::DECIMAL / SUM(fu.usage_count)::DECIMAL
            ELSE 0
        END as average_time_spent
    FROM feature_usage fu
    WHERE fu.last_used BETWEEN p_start_date AND p_end_date
    GROUP BY fu.feature_name
    ORDER BY total_usage DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_actions TO authenticated;
GRANT ALL ON screen_transitions TO authenticated;
GRANT ALL ON conversion_events TO authenticated;
GRANT ALL ON feature_usage TO authenticated;

GRANT EXECUTE ON FUNCTION upsert_feature_usage TO authenticated;
GRANT EXECUTE ON FUNCTION get_conversion_rates TO authenticated;
GRANT EXECUTE ON FUNCTION get_feature_usage_stats TO authenticated;

-- Create trigger to update updated_at timestamp for feature_usage
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_usage_updated_at
    BEFORE UPDATE ON feature_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing (optional)
-- This would be removed in production
INSERT INTO user_actions (user_id, action_type, screen_name, metadata) VALUES
    ('00000000-0000-0000-0000-000000000000', 'button_click', 'community', '{"button_name": "create_post"}'),
    ('00000000-0000-0000-0000-000000000000', 'content_view', 'learning-dashboard', '{"content_type": "course"}')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE user_actions IS 'Tracks user interactions and actions within the application';
COMMENT ON TABLE screen_transitions IS 'Tracks user navigation patterns between screens';
COMMENT ON TABLE conversion_events IS 'Tracks conversion events for funnel analysis';
COMMENT ON TABLE feature_usage IS 'Tracks feature usage patterns and time spent';

COMMENT ON FUNCTION upsert_feature_usage IS 'Inserts or updates feature usage statistics';
COMMENT ON FUNCTION get_conversion_rates IS 'Calculates conversion rates between funnel steps';
COMMENT ON FUNCTION get_feature_usage_stats IS 'Gets aggregated feature usage statistics';