-- Create announcements table for managing official announcements and news
CREATE TABLE IF NOT EXISTS announcements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('news', 'update', 'event', 'maintenance')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  published BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_announcements_published ON announcements(published);
CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_published_at ON announcements(published_at);
CREATE INDEX idx_announcements_featured ON announcements(featured);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_announcements_updated_at 
    BEFORE UPDATE ON announcements 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published announcements
CREATE POLICY "Anyone can read published announcements" ON announcements
    FOR SELECT USING (published = true);

-- Policy: Authenticated users can read all announcements (for admin interface)
CREATE POLICY "Authenticated users can read all announcements" ON announcements
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Only admins can insert announcements
CREATE POLICY "Only admins can insert announcements" ON announcements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin') 
            AND is_active = true
        )
    );

-- Policy: Only admins can update announcements
CREATE POLICY "Only admins can update announcements" ON announcements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin') 
            AND is_active = true
        )
    );

-- Policy: Only admins can delete announcements
CREATE POLICY "Only admins can delete announcements" ON announcements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'super_admin') 
            AND is_active = true
        )
    );

-- Insert some sample announcements
INSERT INTO announcements (title, content, type, priority, published, featured, author_name, published_at) VALUES
(
    '新機能リリース: AI学習アシスタント',
    'AI技術を活用した学習アシスタント機能をリリースしました。個人の学習進度に合わせたカスタマイズされた学習プランを提供します。',
    'news',
    'high',
    true,
    true,
    'システム管理者',
    NOW() - INTERVAL '3 days'
),
(
    'グローバル学習イベント開催のお知らせ',
    '2024年2月15日〜17日に開催される国際的な学習イベントの参加者を募集しています。世界中の学習者と交流する絶好の機会です。',
    'event',
    'medium',
    true,
    false,
    'イベント担当',
    NOW() - INTERVAL '5 days'
),
(
    'アプリアップデート v2.1.0',
    'パフォーマンスの向上とバグ修正を含むアップデートをリリースしました。新しいダークモードテーマも追加されています。',
    'update',
    'medium',
    true,
    false,
    '開発チーム',
    NOW() - INTERVAL '7 days'
),
(
    'システムメンテナンスのお知らせ',
    '2024年1月20日 2:00-4:00（JST）にシステムメンテナンスを実施します。この間、一部機能がご利用いただけません。',
    'maintenance',
    'high',
    true,
    true,
    'システム管理者',
    NOW() - INTERVAL '10 days'
);

-- Create function to get published announcements
CREATE OR REPLACE FUNCTION get_published_announcements(
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    content TEXT,
    type TEXT,
    priority TEXT,
    featured BOOLEAN,
    author_name TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.title,
        a.content,
        a.type,
        a.priority,
        a.featured,
        a.author_name,
        a.published_at,
        a.expires_at,
        a.created_at,
        a.updated_at
    FROM announcements a
    WHERE a.published = true
    AND (a.expires_at IS NULL OR a.expires_at > NOW())
    ORDER BY a.featured DESC, a.published_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;