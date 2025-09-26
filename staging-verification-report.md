# PeerLearningHub ステージング環境検証レポート

## 実行サマリー

- **実行日時**: 2025/9/26 7:58:57
- **実行時間**: 3分6秒
- **全体判定**: ❌ 不合格
- **成功率**: 9%

## テスト結果

### 機能テスト (要件 3.1-3.4)
- **合格**: 0
- **不合格**: 6

### パフォーマンステスト (要件 3.5, 7.1-7.5)
- **合格**: 1
- **不合格**: 5

### セキュリティテスト (要件 3.6, 8.1-8.5)
- **合格**: 1
- **不合格**: 5

### ユーザー受け入れテスト
- **合格**: 0
- **不合格**: 5

## 詳細結果


### Functional

| テスト名 | 結果 | 詳細 |
|----------|------|------|
| Database Migrations | ❌ | Command failed: node scripts/runStagingMigrations.js
Staging migrations failed: Error: Missing staging Supabase credentials
    at runStagingMigrations (/Users/tizuka0/Documents/Kiro/PeerLearningHub/scripts/runStagingMigrations.js:18:11)
    at Object.<anonymous> (/Users/tizuka0/Documents/Kiro/PeerLearningHub/scripts/runStagingMigrations.js:59:3)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49
 |
| 認証システムテスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| コミュニティ機能テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| 外部システム連携テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| メンバーシップ機能テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| Integrated Functional Test Suite | ❌ | Command failed: npm run test:functional
FAIL tests/functional-test-suite.test.ts
  ● Test suite failed to run

    /Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js: 'loose' mode configuration must be the same for @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods and @babel/plugin-transform-private-property-in-object (when they are enabled).

    If you already set the same 'loose' mode for these plugins in your config, it's possible that they are enabled multiple times with different options.
    You can re-run Babel with the BABEL_SHOW_CONFIG_FOR environment variable to show the loaded configuration:
    	npx cross-env BABEL_SHOW_CONFIG_FOR=/Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js <your build command>
    See https://babeljs.io/docs/configuration#print-effective-configs for more info.

      at enableFeature (node_modules/@babel/helper-create-class-features-plugin/lib/features.js:50:13)
      at PluginPass.pre (node_modules/@babel/helper-create-class-features-plugin/lib/index.js:100:35)
      at PluginPass.sync (node_modules/@babel/core/lib/gensync-utils/async.js:30:25)
      at PluginPass.sync (node_modules/gensync/index.js:182:19)
      at PluginPass.<anonymous> (node_modules/gensync/index.js:210:24)
      at transformFile (node_modules/@babel/core/lib/transformation/index.js:75:19)
          at transformFile.next (<anonymous>)
      at run (node_modules/@babel/core/lib/transformation/index.js:25:12)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/lib/transform.js:22:33)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at stopHiding - secret - don't use this - v1 (node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
      at transformSync (node_modules/@babel/core/lib/transform.js:42:76)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.416 s
Ran all test suites matching /tests\/functional-test-suite.test.ts/i.
 |


### Performance

| テスト名 | 結果 | 詳細 |
|----------|------|------|
| アプリ起動時間テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| 画面遷移時間テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| APIレスポンス時間テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| メモリ使用量テスト | ✅ | 成功 |
| ネットワーク効率性テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| Integrated Performance Test Suite | ❌ | Command failed: npm run test:performance
FAIL tests/performance-test-suite.test.ts
  ● Test suite failed to run

    /Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js: 'loose' mode configuration must be the same for @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods and @babel/plugin-transform-private-property-in-object (when they are enabled).

    If you already set the same 'loose' mode for these plugins in your config, it's possible that they are enabled multiple times with different options.
    You can re-run Babel with the BABEL_SHOW_CONFIG_FOR environment variable to show the loaded configuration:
    	npx cross-env BABEL_SHOW_CONFIG_FOR=/Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js <your build command>
    See https://babeljs.io/docs/configuration#print-effective-configs for more info.

      at enableFeature (node_modules/@babel/helper-create-class-features-plugin/lib/features.js:50:13)
      at PluginPass.pre (node_modules/@babel/helper-create-class-features-plugin/lib/index.js:100:35)
      at PluginPass.sync (node_modules/@babel/core/lib/gensync-utils/async.js:30:25)
      at PluginPass.sync (node_modules/gensync/index.js:182:19)
      at PluginPass.<anonymous> (node_modules/gensync/index.js:210:24)
      at transformFile (node_modules/@babel/core/lib/transformation/index.js:75:19)
          at transformFile.next (<anonymous>)
      at run (node_modules/@babel/core/lib/transformation/index.js:25:12)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/lib/transform.js:22:33)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at stopHiding - secret - don't use this - v1 (node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
      at transformSync (node_modules/@babel/core/lib/transform.js:42:76)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.373 s
Ran all test suites matching /tests\/performance-test-suite.test.ts/i.
 |


### Security

| テスト名 | 結果 | 詳細 |
|----------|------|------|
| HTTPS強制テスト | ❌ | Protocol "http:" not supported. Expected "https:" |
| セキュリティヘッダーテスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| 認証要件テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| 入力検証テスト | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| レート制限テスト | ✅ | 成功 |
| Integrated Security Test Suite | ❌ | Command failed: npm run test:security
FAIL tests/security-test-suite.test.ts
  ● Test suite failed to run

    /Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js: 'loose' mode configuration must be the same for @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods and @babel/plugin-transform-private-property-in-object (when they are enabled).

    If you already set the same 'loose' mode for these plugins in your config, it's possible that they are enabled multiple times with different options.
    You can re-run Babel with the BABEL_SHOW_CONFIG_FOR environment variable to show the loaded configuration:
    	npx cross-env BABEL_SHOW_CONFIG_FOR=/Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js <your build command>
    See https://babeljs.io/docs/configuration#print-effective-configs for more info.

      at enableFeature (node_modules/@babel/helper-create-class-features-plugin/lib/features.js:50:13)
      at PluginPass.pre (node_modules/@babel/helper-create-class-features-plugin/lib/index.js:100:35)
      at PluginPass.sync (node_modules/@babel/core/lib/gensync-utils/async.js:30:25)
      at PluginPass.sync (node_modules/gensync/index.js:182:19)
      at PluginPass.<anonymous> (node_modules/gensync/index.js:210:24)
      at transformFile (node_modules/@babel/core/lib/transformation/index.js:75:19)
          at transformFile.next (<anonymous>)
      at run (node_modules/@babel/core/lib/transformation/index.js:25:12)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/lib/transform.js:22:33)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at stopHiding - secret - don't use this - v1 (node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
      at transformSync (node_modules/@babel/core/lib/transform.js:42:76)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.368 s
Ran all test suites matching /tests\/security-test-suite.test.ts/i.
 |


### UserAcceptance

| テスト名 | 結果 | 詳細 |
|----------|------|------|
| ユーザー登録フロー | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| ログインフロー | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| コミュニティ投稿フロー | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| メンバーシップ購入フロー | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |
| 外部システム連携フロー | ❌ | getaddrinfo ENOTFOUND staging.peerlearninghub.com |



## エラー

- ❌ functional: Database Migrations - Command failed: node scripts/runStagingMigrations.js
Staging migrations failed: Error: Missing staging Supabase credentials
    at runStagingMigrations (/Users/tizuka0/Documents/Kiro/PeerLearningHub/scripts/runStagingMigrations.js:18:11)
    at Object.<anonymous> (/Users/tizuka0/Documents/Kiro/PeerLearningHub/scripts/runStagingMigrations.js:59:3)
    at Module._compile (node:internal/modules/cjs/loader:1730:14)
    at Object..js (node:internal/modules/cjs/loader:1895:10)
    at Module.load (node:internal/modules/cjs/loader:1465:32)
    at Function._load (node:internal/modules/cjs/loader:1282:12)
    at TracingChannel.traceSync (node:diagnostics_channel:322:14)
    at wrapModuleLoad (node:internal/modules/cjs/loader:235:24)
    at Function.executeUserEntryPoint [as runMain] (node:internal/modules/run_main:171:5)
    at node:internal/main/run_main_module:36:49

- ❌ functional: 認証システムテスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ functional: コミュニティ機能テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ functional: 外部システム連携テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ functional: メンバーシップ機能テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ functional: Integrated Functional Test Suite - Command failed: npm run test:functional
FAIL tests/functional-test-suite.test.ts
  ● Test suite failed to run

    /Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js: 'loose' mode configuration must be the same for @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods and @babel/plugin-transform-private-property-in-object (when they are enabled).

    If you already set the same 'loose' mode for these plugins in your config, it's possible that they are enabled multiple times with different options.
    You can re-run Babel with the BABEL_SHOW_CONFIG_FOR environment variable to show the loaded configuration:
    	npx cross-env BABEL_SHOW_CONFIG_FOR=/Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js <your build command>
    See https://babeljs.io/docs/configuration#print-effective-configs for more info.

      at enableFeature (node_modules/@babel/helper-create-class-features-plugin/lib/features.js:50:13)
      at PluginPass.pre (node_modules/@babel/helper-create-class-features-plugin/lib/index.js:100:35)
      at PluginPass.sync (node_modules/@babel/core/lib/gensync-utils/async.js:30:25)
      at PluginPass.sync (node_modules/gensync/index.js:182:19)
      at PluginPass.<anonymous> (node_modules/gensync/index.js:210:24)
      at transformFile (node_modules/@babel/core/lib/transformation/index.js:75:19)
          at transformFile.next (<anonymous>)
      at run (node_modules/@babel/core/lib/transformation/index.js:25:12)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/lib/transform.js:22:33)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at stopHiding - secret - don't use this - v1 (node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
      at transformSync (node_modules/@babel/core/lib/transform.js:42:76)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.416 s
Ran all test suites matching /tests\/functional-test-suite.test.ts/i.

- ❌ performance: アプリ起動時間テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ performance: 画面遷移時間テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ performance: APIレスポンス時間テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ performance: ネットワーク効率性テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ performance: Integrated Performance Test Suite - Command failed: npm run test:performance
FAIL tests/performance-test-suite.test.ts
  ● Test suite failed to run

    /Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js: 'loose' mode configuration must be the same for @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods and @babel/plugin-transform-private-property-in-object (when they are enabled).

    If you already set the same 'loose' mode for these plugins in your config, it's possible that they are enabled multiple times with different options.
    You can re-run Babel with the BABEL_SHOW_CONFIG_FOR environment variable to show the loaded configuration:
    	npx cross-env BABEL_SHOW_CONFIG_FOR=/Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js <your build command>
    See https://babeljs.io/docs/configuration#print-effective-configs for more info.

      at enableFeature (node_modules/@babel/helper-create-class-features-plugin/lib/features.js:50:13)
      at PluginPass.pre (node_modules/@babel/helper-create-class-features-plugin/lib/index.js:100:35)
      at PluginPass.sync (node_modules/@babel/core/lib/gensync-utils/async.js:30:25)
      at PluginPass.sync (node_modules/gensync/index.js:182:19)
      at PluginPass.<anonymous> (node_modules/gensync/index.js:210:24)
      at transformFile (node_modules/@babel/core/lib/transformation/index.js:75:19)
          at transformFile.next (<anonymous>)
      at run (node_modules/@babel/core/lib/transformation/index.js:25:12)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/lib/transform.js:22:33)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at stopHiding - secret - don't use this - v1 (node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
      at transformSync (node_modules/@babel/core/lib/transform.js:42:76)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.373 s
Ran all test suites matching /tests\/performance-test-suite.test.ts/i.

- ❌ security: HTTPS強制テスト - Protocol "http:" not supported. Expected "https:"
- ❌ security: セキュリティヘッダーテスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ security: 認証要件テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ security: 入力検証テスト - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ security: Integrated Security Test Suite - Command failed: npm run test:security
FAIL tests/security-test-suite.test.ts
  ● Test suite failed to run

    /Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js: 'loose' mode configuration must be the same for @babel/plugin-transform-class-properties, @babel/plugin-transform-private-methods and @babel/plugin-transform-private-property-in-object (when they are enabled).

    If you already set the same 'loose' mode for these plugins in your config, it's possible that they are enabled multiple times with different options.
    You can re-run Babel with the BABEL_SHOW_CONFIG_FOR environment variable to show the loaded configuration:
    	npx cross-env BABEL_SHOW_CONFIG_FOR=/Users/tizuka0/Documents/Kiro/PeerLearningHub/node_modules/react-native/jest/setup.js <your build command>
    See https://babeljs.io/docs/configuration#print-effective-configs for more info.

      at enableFeature (node_modules/@babel/helper-create-class-features-plugin/lib/features.js:50:13)
      at PluginPass.pre (node_modules/@babel/helper-create-class-features-plugin/lib/index.js:100:35)
      at PluginPass.sync (node_modules/@babel/core/lib/gensync-utils/async.js:30:25)
      at PluginPass.sync (node_modules/gensync/index.js:182:19)
      at PluginPass.<anonymous> (node_modules/gensync/index.js:210:24)
      at transformFile (node_modules/@babel/core/lib/transformation/index.js:75:19)
          at transformFile.next (<anonymous>)
      at run (node_modules/@babel/core/lib/transformation/index.js:25:12)
          at run.next (<anonymous>)
      at transform (node_modules/@babel/core/lib/transform.js:22:33)
          at transform.next (<anonymous>)
      at evaluateSync (node_modules/gensync/index.js:251:28)
      at sync (node_modules/gensync/index.js:89:14)
      at stopHiding - secret - don't use this - v1 (node_modules/@babel/core/lib/errors/rewrite-stack-trace.js:47:12)
      at transformSync (node_modules/@babel/core/lib/transform.js:42:76)
      at ScriptTransformer.transformSource (node_modules/@jest/transform/build/ScriptTransformer.js:545:31)
      at ScriptTransformer._transformAndBuildScript (node_modules/@jest/transform/build/ScriptTransformer.js:674:40)
      at ScriptTransformer.transform (node_modules/@jest/transform/build/ScriptTransformer.js:726:19)

Test Suites: 1 failed, 1 total
Tests:       0 total
Snapshots:   0 total
Time:        0.368 s
Ran all test suites matching /tests\/security-test-suite.test.ts/i.

- ❌ userAcceptance: ユーザー登録フロー - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ userAcceptance: ログインフロー - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ userAcceptance: コミュニティ投稿フロー - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ userAcceptance: メンバーシップ購入フロー - getaddrinfo ENOTFOUND staging.peerlearninghub.com
- ❌ userAcceptance: 外部システム連携フロー - getaddrinfo ENOTFOUND staging.peerlearninghub.com



## 警告

- ⚠️ Missing environment variable: STAGING_SUPABASE_URL
- ⚠️ Missing environment variable: STAGING_SUPABASE_ANON_KEY
- ⚠️ Missing environment variable: STAGING_REVENUECAT_API_KEY
- ⚠️ Staging warmup failed
- ⚠️ Rate limiting may not be configured


## 推奨事項

### 🚨 緊急対応
失敗したテストを修正してから本番デプロイを実行してください。

### 🔒 セキュリティ
セキュリティテストの失敗は重大です。すぐに修正してください。

### ⚡ パフォーマンス
パフォーマンス要件を満たしていません。最適化を実施してください。

### ⚠️ 警告事項
警告事項を確認し、必要に応じて対応してください。


---
*このレポートは最終ステージング検証により自動生成されました*
