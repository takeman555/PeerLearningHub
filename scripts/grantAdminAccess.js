/**
 * 管理者権限を付与するスクリプト
 * 現在ログインしているユーザーまたは指定されたユーザーに管理者権限を付与します
 */

const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// 環境変数を読み込み
dotenv.config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 環境変数が設定されていません');
  console.log('必要な環境変数:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Service Role キーでSupabaseクライアントを作成
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function grantAdminAccess(userEmail) {
  console.log(`🔧 ${userEmail} に管理者権限を付与中...\n`);

  try {
    // ユーザーをメールアドレスで検索
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ ユーザー一覧取得エラー:', listError.message);
      return;
    }

    const user = users.users.find(u => u.email === userEmail);
    if (!user) {
      console.error(`❌ ユーザーが見つかりません: ${userEmail}`);
      return;
    }

    console.log(`👤 ユーザー情報:`);
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   現在のロール: ${user.user_metadata?.role || 'なし'}\n`);

    // 1. user_metadata を更新
    const { error: metadataError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { 
        ...user.user_metadata,
        role: 'admin' 
      }
    });

    if (metadataError) {
      console.log('⚠️  user_metadata 更新エラー:', metadataError.message);
    } else {
      console.log('✅ user_metadata に admin ロールを設定しました');
    }

    // 2. profiles テーブルを確認・作成
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code === 'PGRST116') {
      // プロファイルが存在しない場合は作成
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.email.split('@')[0],
          is_active: true
        });

      if (createProfileError) {
        console.log('⚠️  プロファイル作成エラー:', createProfileError.message);
      } else {
        console.log('✅ プロファイルを作成しました');
      }
    } else if (profileError) {
      console.log('⚠️  プロファイル確認エラー:', profileError.message);
    } else {
      console.log('✅ プロファイルが存在します');
    }

    // 3. user_roles テーブルに追加
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        role: 'admin',
        is_active: true
      }, {
        onConflict: 'user_id,role'
      });

    if (roleError) {
      console.log('⚠️  user_roles テーブル更新エラー:', roleError.message);
    } else {
      console.log('✅ user_roles テーブルに admin ロールを追加しました');
    }

    console.log('\n🎉 管理者権限の付与が完了しました！');
    console.log('アプリを再起動して管理画面にアクセスしてください。');

  } catch (error) {
    console.error('❌ 管理者権限付与中にエラーが発生しました:', error);
  }
}

async function listUsers() {
  console.log('👥 登録済みユーザー一覧:\n');

  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ ユーザー一覧取得エラー:', error.message);
      return;
    }

    if (users.users.length === 0) {
      console.log('ユーザーが登録されていません');
      return;
    }

    users.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   ロール: ${user.user_metadata?.role || 'なし'}`);
      console.log(`   作成日: ${new Date(user.created_at).toLocaleString('ja-JP')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ ユーザー一覧取得中にエラーが発生しました:', error);
  }
}

// コマンドライン引数を処理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'list') {
  listUsers()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else if (command === 'grant') {
  const userEmail = args[1];
  if (!userEmail) {
    console.log('❌ ユーザーのメールアドレスを指定してください');
    console.log('使用方法:');
    console.log('  node scripts/grantAdminAccess.js grant <email>');
    console.log('  node scripts/grantAdminAccess.js list');
    process.exit(1);
  }
  grantAdminAccess(userEmail)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  console.log('🔧 管理者権限付与スクリプト\n');
  console.log('使用方法:');
  console.log('  node scripts/grantAdminAccess.js list          # ユーザー一覧を表示');
  console.log('  node scripts/grantAdminAccess.js grant <email> # 指定したユーザーに管理者権限を付与');
  console.log('\n例:');
  console.log('  node scripts/grantAdminAccess.js grant user@example.com');
}