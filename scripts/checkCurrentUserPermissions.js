const { supabase } = require('../config/supabase');

/**
 * 現在のユーザーの権限状況を確認するスクリプト
 */

async function checkCurrentUserPermissions() {
  console.log('🔍 現在のユーザー権限状況を確認中...\n');

  try {
    // 現在のセッション情報を取得
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ セッション取得エラー:', sessionError.message);
      return;
    }

    if (!session) {
      console.log('❌ ログインしていません');
      return;
    }

    const user = session.user;
    console.log('👤 現在のユーザー情報:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   User Metadata Role: ${user.user_metadata?.role || 'なし'}`);
    console.log(`   App Metadata Role: ${user.app_metadata?.role || 'なし'}\n`);

    // プロファイル情報を確認
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.log('⚠️  プロファイル取得エラー:', profileError.message);
    } else if (profile) {
      console.log('📋 プロファイル情報:');
      console.log(`   Full Name: ${profile.full_name || 'なし'}`);
      console.log(`   Is Active: ${profile.is_active}`);
      console.log(`   Created At: ${profile.created_at}\n`);
    } else {
      console.log('❌ プロファイルが見つかりません\n');
    }

    // ユーザーロール情報を確認
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', user.id);

    if (rolesError) {
      console.log('⚠️  ユーザーロール取得エラー:', rolesError.message);
    } else if (userRoles && userRoles.length > 0) {
      console.log('🎭 ユーザーロール情報:');
      userRoles.forEach((role, index) => {
        console.log(`   ${index + 1}. Role: ${role.role}`);
        console.log(`      Active: ${role.is_active}`);
        console.log(`      Created: ${role.created_at}`);
      });
      console.log('');
    } else {
      console.log('❌ ユーザーロールが設定されていません\n');
    }

    // 権限チェック結果
    console.log('🔐 権限チェック結果:');
    
    // 古い方式での権限チェック
    const { hasAdminAccess } = require('../utils/permissions');
    const oldStyleAccess = hasAdminAccess(user.user_metadata?.role);
    console.log(`   旧方式 (user_metadata): ${oldStyleAccess ? '✅ 管理者アクセス可能' : '❌ 管理者アクセス不可'}`);

    // 新しい方式での権限チェック
    try {
      const { permissionManager } = require('../services/permissionManager');
      const newStylePermission = await permissionManager.canManageGroups(user.id);
      console.log(`   新方式 (permissionManager): ${newStylePermission.allowed ? '✅ グループ管理可能' : '❌ グループ管理不可'}`);
      if (!newStylePermission.allowed) {
        console.log(`      理由: ${newStylePermission.reason}`);
      }
    } catch (error) {
      console.log('   新方式チェックエラー:', error.message);
    }

    // 管理者権限を付与する方法を提案
    console.log('\n💡 管理者権限を付与する方法:');
    console.log('   1. user_metadata に role を設定:');
    console.log(`      UPDATE auth.users SET raw_user_meta_data = '{"role": "admin"}' WHERE id = '${user.id}';`);
    console.log('   2. user_roles テーブルにレコードを追加:');
    console.log(`      INSERT INTO user_roles (user_id, role, is_active) VALUES ('${user.id}', 'admin', true);`);

  } catch (error) {
    console.error('❌ 権限チェック中にエラーが発生しました:', error);
  }
}

// 管理者権限を付与する関数
async function grantAdminAccess(userId) {
  console.log(`🔧 ユーザー ${userId} に管理者権限を付与中...\n`);

  try {
    // user_metadata を更新
    const { error: metadataError } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: 'admin' }
    });

    if (metadataError) {
      console.log('⚠️  user_metadata 更新エラー:', metadataError.message);
    } else {
      console.log('✅ user_metadata に admin ロールを設定しました');
    }

    // user_roles テーブルに追加
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role: 'admin',
        is_active: true
      });

    if (roleError) {
      console.log('⚠️  user_roles テーブル更新エラー:', roleError.message);
    } else {
      console.log('✅ user_roles テーブルに admin ロールを追加しました');
    }

    console.log('\n🎉 管理者権限の付与が完了しました！');

  } catch (error) {
    console.error('❌ 管理者権限付与中にエラーが発生しました:', error);
  }
}

// コマンドライン引数を処理
const args = process.argv.slice(2);
const command = args[0];

if (command === 'grant') {
  const userId = args[1];
  if (!userId) {
    console.log('❌ ユーザーIDを指定してください: node scripts/checkCurrentUserPermissions.js grant <user_id>');
    process.exit(1);
  }
  grantAdminAccess(userId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
} else {
  checkCurrentUserPermissions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}