-- RevenueCat統合のためのメンバーシップ関連テーブル

-- プロフィールテーブルにメンバーシップ関連カラムを追加
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS user_type TEXT DEFAULT 'visitor' CHECK (user_type IN ('visitor', 'member', 'admin')),
ADD COLUMN IF NOT EXISTS membership_status TEXT DEFAULT 'none' CHECK (membership_status IN ('none', 'active', 'expired', 'cancelled')),
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revenuecat_user_id TEXT;

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_profiles_user_type ON profiles(user_type);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_status ON profiles(membership_status);
CREATE INDEX IF NOT EXISTS idx_profiles_membership_expires_at ON profiles(membership_expires_at);

-- アプリ内購入履歴テーブル
CREATE TABLE IF NOT EXISTS in_app_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  purchase_date TIMESTAMPTZ NOT NULL,
  revenuecat_transaction_id TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_in_app_purchases_user_id ON in_app_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_in_app_purchases_product_id ON in_app_purchases(product_id);
CREATE INDEX IF NOT EXISTS idx_in_app_purchases_purchase_date ON in_app_purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_in_app_purchases_status ON in_app_purchases(status);

-- メンバーシップ履歴テーブル
CREATE TABLE IF NOT EXISTS membership_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  previous_type TEXT,
  new_type TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスを追加
CREATE INDEX IF NOT EXISTS idx_membership_history_user_id ON membership_history(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_history_effective_date ON membership_history(effective_date);

-- RLS (Row Level Security) ポリシーを設定

-- プロフィールテーブルのRLSポリシー更新
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- アプリ内購入履歴のRLSポリシー
ALTER TABLE in_app_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON in_app_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert purchases" ON in_app_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 管理者は全ての購入履歴を閲覧可能
CREATE POLICY "Admins can view all purchases" ON in_app_purchases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- メンバーシップ履歴のRLSポリシー
ALTER TABLE membership_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own membership history" ON membership_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert membership history" ON membership_history
  FOR INSERT WITH CHECK (true); -- システムが履歴を記録

-- 管理者は全てのメンバーシップ履歴を閲覧可能
CREATE POLICY "Admins can view all membership history" ON membership_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.user_type = 'admin'
    )
  );

-- メンバーシップ状態変更を記録するトリガー関数
CREATE OR REPLACE FUNCTION log_membership_change()
RETURNS TRIGGER AS $$
BEGIN
  -- メンバーシップ関連の変更があった場合のみ記録
  IF (OLD.user_type IS DISTINCT FROM NEW.user_type) OR 
     (OLD.membership_status IS DISTINCT FROM NEW.membership_status) THEN
    
    INSERT INTO membership_history (
      user_id,
      previous_type,
      new_type,
      previous_status,
      new_status,
      effective_date,
      expires_at,
      reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.user_type,
      NEW.user_type,
      OLD.membership_status,
      NEW.membership_status,
      NOW(),
      NEW.membership_expires_at,
      'System update',
      jsonb_build_object(
        'updated_at', NEW.updated_at,
        'previous_expires_at', OLD.membership_expires_at,
        'new_expires_at', NEW.membership_expires_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを作成
DROP TRIGGER IF EXISTS membership_change_trigger ON profiles;
CREATE TRIGGER membership_change_trigger
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_membership_change();

-- 期限切れメンバーシップを自動的に更新する関数
CREATE OR REPLACE FUNCTION update_expired_memberships()
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET 
    membership_status = 'expired',
    updated_at = NOW()
  WHERE 
    membership_status = 'active' 
    AND membership_expires_at IS NOT NULL 
    AND membership_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 期限切れチェック用のスケジュール関数（手動実行用）
COMMENT ON FUNCTION update_expired_memberships() IS 'Run this function periodically to update expired memberships';

-- 統計用のビュー
CREATE OR REPLACE VIEW membership_stats AS
SELECT 
  user_type,
  membership_status,
  COUNT(*) as user_count,
  COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
FROM profiles 
GROUP BY user_type, membership_status
ORDER BY user_type, membership_status;

-- 収益統計用のビュー
CREATE OR REPLACE VIEW revenue_stats AS
SELECT 
  product_id,
  currency,
  COUNT(*) as purchase_count,
  SUM(amount) as total_revenue,
  AVG(amount) as average_amount,
  DATE_TRUNC('month', purchase_date) as month
FROM in_app_purchases 
WHERE status = 'completed'
GROUP BY product_id, currency, DATE_TRUNC('month', purchase_date)
ORDER BY month DESC, total_revenue DESC;

-- コメント追加
COMMENT ON TABLE in_app_purchases IS 'RevenueCat integration - stores purchase history';
COMMENT ON TABLE membership_history IS 'Tracks all membership status changes';
COMMENT ON VIEW membership_stats IS 'Current membership distribution statistics';
COMMENT ON VIEW revenue_stats IS 'Monthly revenue statistics by product';