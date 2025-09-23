-- External Systems Cache Tables
-- This migration creates tables to cache external system data

-- External Projects Cache Table
CREATE TABLE IF NOT EXISTS external_projects_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    source_system VARCHAR(100) NOT NULL, -- 'github', 'gitlab', 'notion', etc.
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'archived'
    difficulty_level VARCHAR(20) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
    category VARCHAR(100),
    tags TEXT[], -- Array of tags
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    requirements TEXT,
    skills_learned TEXT[],
    project_url VARCHAR(1000),
    repository_url VARCHAR(1000),
    contact_info JSONB,
    metadata JSONB, -- Additional flexible data
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External Sessions Cache Table
CREATE TABLE IF NOT EXISTS external_sessions_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    source_system VARCHAR(100) NOT NULL, -- 'zoom', 'discord', 'teams', etc.
    title VARCHAR(500) NOT NULL,
    description TEXT,
    session_type VARCHAR(50) DEFAULT 'workshop', -- 'workshop', 'seminar', 'study_group', 'mentoring'
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed', 'cancelled'
    difficulty_level VARCHAR(20) DEFAULT 'intermediate',
    category VARCHAR(100),
    tags TEXT[],
    scheduled_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    language VARCHAR(10) DEFAULT 'ja', -- 'ja', 'en', 'ko', etc.
    session_url VARCHAR(1000),
    meeting_id VARCHAR(255),
    password VARCHAR(255),
    host_info JSONB,
    requirements TEXT,
    materials_url VARCHAR(1000),
    recording_url VARCHAR(1000),
    metadata JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External Accommodations Cache Table
CREATE TABLE IF NOT EXISTS external_accommodations_cache (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    external_id VARCHAR(255) NOT NULL,
    source_system VARCHAR(100) NOT NULL, -- 'airbnb', 'booking', 'custom_api', etc.
    name VARCHAR(500) NOT NULL,
    description TEXT,
    accommodation_type VARCHAR(50) DEFAULT 'apartment', -- 'apartment', 'house', 'room', 'dormitory'
    status VARCHAR(50) DEFAULT 'available', -- 'available', 'booked', 'maintenance', 'unavailable'
    location JSONB, -- {address, city, country, coordinates}
    capacity INTEGER,
    amenities TEXT[],
    price_per_night DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'JPY',
    minimum_stay_nights INTEGER DEFAULT 1,
    maximum_stay_nights INTEGER,
    check_in_time TIME,
    check_out_time TIME,
    house_rules TEXT[],
    cancellation_policy TEXT,
    images_urls TEXT[],
    booking_url VARCHAR(1000),
    contact_info JSONB,
    availability_calendar JSONB, -- Flexible availability data
    rating DECIMAL(3,2),
    review_count INTEGER DEFAULT 0,
    host_info JSONB,
    metadata JSONB,
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User External System Connections
CREATE TABLE IF NOT EXISTS user_external_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    external_system VARCHAR(100) NOT NULL,
    external_user_id VARCHAR(255),
    connection_data JSONB, -- API keys, tokens, etc. (encrypted)
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, external_system)
);

-- User Project Participations (for external projects)
CREATE TABLE IF NOT EXISTS user_project_participations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES external_projects_cache(id) ON DELETE CASCADE,
    participation_status VARCHAR(50) DEFAULT 'interested', -- 'interested', 'applied', 'accepted', 'active', 'completed', 'withdrawn'
    role VARCHAR(100), -- 'participant', 'mentor', 'leader', etc.
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, project_id)
);

-- User Session Registrations (for external sessions)
CREATE TABLE IF NOT EXISTS user_session_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES external_sessions_cache(id) ON DELETE CASCADE,
    registration_status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'attended', 'no_show', 'cancelled'
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    attended_at TIMESTAMP WITH TIME ZONE,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comment TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, session_id)
);

-- User Accommodation Bookings (for external accommodations)
CREATE TABLE IF NOT EXISTS user_accommodation_bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    accommodation_id UUID REFERENCES external_accommodations_cache(id) ON DELETE CASCADE,
    booking_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guest_count INTEGER DEFAULT 1,
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'JPY',
    external_booking_id VARCHAR(255),
    booking_url VARCHAR(1000),
    special_requests TEXT,
    booking_notes TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_projects_source_system ON external_projects_cache(source_system);
CREATE INDEX IF NOT EXISTS idx_external_projects_status ON external_projects_cache(status);
CREATE INDEX IF NOT EXISTS idx_external_projects_category ON external_projects_cache(category);
CREATE INDEX IF NOT EXISTS idx_external_projects_last_synced ON external_projects_cache(last_synced_at);

CREATE INDEX IF NOT EXISTS idx_external_sessions_source_system ON external_sessions_cache(source_system);
CREATE INDEX IF NOT EXISTS idx_external_sessions_status ON external_sessions_cache(status);
CREATE INDEX IF NOT EXISTS idx_external_sessions_scheduled_at ON external_sessions_cache(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_external_sessions_category ON external_sessions_cache(category);

CREATE INDEX IF NOT EXISTS idx_external_accommodations_source_system ON external_accommodations_cache(source_system);
CREATE INDEX IF NOT EXISTS idx_external_accommodations_status ON external_accommodations_cache(status);
CREATE INDEX IF NOT EXISTS idx_external_accommodations_location ON external_accommodations_cache USING GIN(location);

CREATE INDEX IF NOT EXISTS idx_user_external_connections_user_id ON user_external_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_external_connections_system ON user_external_connections(external_system);

CREATE INDEX IF NOT EXISTS idx_user_project_participations_user_id ON user_project_participations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_project_participations_project_id ON user_project_participations(project_id);
CREATE INDEX IF NOT EXISTS idx_user_project_participations_status ON user_project_participations(participation_status);

CREATE INDEX IF NOT EXISTS idx_user_session_registrations_user_id ON user_session_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_session_registrations_session_id ON user_session_registrations(session_id);

CREATE INDEX IF NOT EXISTS idx_user_accommodation_bookings_user_id ON user_accommodation_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_accommodation_bookings_accommodation_id ON user_accommodation_bookings(accommodation_id);
CREATE INDEX IF NOT EXISTS idx_user_accommodation_bookings_dates ON user_accommodation_bookings(check_in_date, check_out_date);

-- Row Level Security (RLS) Policies
ALTER TABLE external_projects_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_sessions_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_accommodations_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_external_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_project_participations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_session_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_accommodation_bookings ENABLE ROW LEVEL SECURITY;

-- Public read access for cache tables (they contain public information)
CREATE POLICY "Public read access for external projects" ON external_projects_cache
    FOR SELECT USING (true);

CREATE POLICY "Public read access for external sessions" ON external_sessions_cache
    FOR SELECT USING (true);

CREATE POLICY "Public read access for external accommodations" ON external_accommodations_cache
    FOR SELECT USING (true);

-- User-specific policies for connection and participation tables
CREATE POLICY "Users can view their own external connections" ON user_external_connections
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own external connections" ON user_external_connections
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own project participations" ON user_project_participations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own project participations" ON user_project_participations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own session registrations" ON user_session_registrations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own session registrations" ON user_session_registrations
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own accommodation bookings" ON user_accommodation_bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own accommodation bookings" ON user_accommodation_bookings
    FOR ALL USING (auth.uid() = user_id);

-- Admin policies (assuming admin role exists in profiles)
CREATE POLICY "Admins can manage external projects cache" ON external_projects_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage external sessions cache" ON external_sessions_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage external accommodations cache" ON external_accommodations_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_external_projects_cache_updated_at 
    BEFORE UPDATE ON external_projects_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_sessions_cache_updated_at 
    BEFORE UPDATE ON external_sessions_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_accommodations_cache_updated_at 
    BEFORE UPDATE ON external_accommodations_cache 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_external_connections_updated_at 
    BEFORE UPDATE ON user_external_connections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_project_participations_updated_at 
    BEFORE UPDATE ON user_project_participations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_session_registrations_updated_at 
    BEFORE UPDATE ON user_session_registrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_accommodation_bookings_updated_at 
    BEFORE UPDATE ON user_accommodation_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();