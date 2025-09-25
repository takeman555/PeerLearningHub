# 投稿作成エラー修正レポート

## 問題の概要
フィードに投稿する際に以下のエラーが発生していました：

```
ERROR  Error creating post: {"code": "PGRST200", "details": "Searched for a foreign key relationship between 'posts' and 'profiles' using the hint 'posts_user_id_fkey' in the schema 'public', but no matches were found.", "hint": "Perhaps you meant 'projects' instead of 'posts'.", "message": "Could not find a relationship between 'posts' and 'profiles' in the schema cache"}
```

## 根本原因
PostgRESTのスキーマキャッシュが外部キー関係を正しく認識できていない状態で、JOINクエリを使用していたため。

## 修正内容

### 1. communityFeedService.ts の修正

#### createPost メソッド
- JOINクエリを削除し、投稿作成後に別途プロファイル情報を取得するように変更
- エラーコード `PGRST200` も処理対象に追加

#### getUserPosts メソッド  
- JOINクエリを削除し、投稿取得後に別途プロファイル情報を取得するように変更
- 同一ユーザーの投稿なので、プロファイル情報は一度だけ取得

#### searchPosts メソッド
- JOINクエリを削除し、各投稿に対して別途プロファイル情報を取得するように変更

### 2. Expo設定の修正

#### app.json
- `scheme: "peerlearninghub"` を追加してLinkingの警告を解決

## 修正後の動作

### 投稿作成フロー
1. 投稿データをpostsテーブルに挿入（JOINなし）
2. 作成された投稿のuser_idを使用してprofilesテーブルから作者情報を取得
3. 投稿データと作者情報を結合してレスポンスを返す

### 投稿取得フロー
1. postsテーブルから投稿一覧を取得（JOINなし）
2. 各投稿のuser_idを使用してprofilesテーブルから作者情報を取得
3. 投稿データと作者情報を結合してレスポンスを返す

## テスト結果
- ✅ 投稿作成が正常に動作
- ✅ 作者情報の取得が正常に動作
- ✅ JOINエラーが解消
- ✅ Linkingの警告が解消

## 今後の対応
1. Supabaseのスキーマキャッシュが正常に動作するようになった場合、パフォーマンス向上のためJOINクエリに戻すことを検討
2. 現在の実装でも十分な性能を発揮するため、当面はこの実装を維持

## 関連ファイル
- `PeerLearningHub/services/communityFeedService.ts` - メインの修正
- `PeerLearningHub/app.json` - Expo設定の修正
- `PeerLearningHub/scripts/createTestProfile.js` - テストスクリプト

## 修正日時
2025年9月25日

## 修正者
Kiro AI Assistant