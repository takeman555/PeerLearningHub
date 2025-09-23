# Supabaseユーザー管理ガイド

## メール確認の問題を解決する

### 方法1: Supabaseダッシュボードで手動確認

1. [Supabaseダッシュボード](https://supabase.com/dashboard) にアクセス
2. プロジェクト `peer-learning-hub` を選択
3. 左サイドバーで「Authentication」→「Users」をクリック
4. `tizuka0@gmail.com` のユーザーを見つける
5. ユーザー行の右側にある「...」メニューをクリック
6. 「Confirm email」を選択
7. これでユーザーのメールが確認済みになります

### 方法2: メール確認を無効にする（開発用）

1. Supabaseダッシュボードで「Authentication」→「Settings」
2. 「Email confirmation」をオフにする
3. これで新規ユーザーは確認なしでログインできます

## パスワードをリセットする

### 方法1: アプリのパスワードリセット機能を使用

1. ログイン画面で「パスワードを忘れた方」をクリック
2. `tizuka0@gmail.com` を入力
3. リセットメールが送信されます

### 方法2: Supabaseダッシュボードで直接変更

1. Supabaseダッシュボードの「Authentication」→「Users」
2. `tizuka0@gmail.com` のユーザーを見つける
3. ユーザー行をクリックして詳細を開く
4. 「Reset Password」ボタンをクリック
5. 新しいパスワードを設定

## 開発用の設定変更

メール確認を無効にして開発を簡単にする：

1. Supabaseダッシュボード → Authentication → Settings
2. 以下の設定を変更：
   - **Enable email confirmations**: OFF
   - **Enable phone confirmations**: OFF
   - **Double confirm email changes**: OFF

これで新規ユーザーは即座にログインできるようになります。

## トラブルシューティング

### メールが届かない場合
- スパムフォルダを確認
- Supabaseの送信制限に達していないか確認
- メールプロバイダーの設定を確認

### ログインできない場合
1. メールアドレスが正しいか確認
2. パスワードが正しいか確認
3. ユーザーがメール確認済みか確認
4. Supabaseダッシュボードでユーザーの状態を確認