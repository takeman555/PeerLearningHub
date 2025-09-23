/**
 * Resource Management Service
 */

import { Resource, CreateResourceRequest, UpdateResourceRequest, ResourceFilter } from '../types/resources';

// Mock data storage
let mockResources: Resource[] = [
  {
    id: '1',
    title: '日本語の基本的な挨拶',
    description: '日本語での基本的な挨拶表現を学びましょう',
    content: `# 日本語の基本的な挨拶

## おはよう系の挨拶
- おはよう (カジュアル)
- おはようございます (丁寧)

## こんにちは系の挨拶
- こんにちは
- こんばんは

## 初対面の挨拶
- はじめまして
- よろしくお願いします`,
    category: 'language_learning',
    type: 'article',
    level: 'beginner',
    tags: ['挨拶', '基本', '日本語'],
    author_id: 'admin-1',
    author_name: '管理者 一郎',
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: true,
    views: 245,
    likes: 18,
    language: 'ja'
  },
  {
    id: '2',
    title: 'Japanese Business Etiquette',
    description: 'Learn essential business etiquette in Japanese culture',
    content: `# Japanese Business Etiquette

## Business Cards (Meishi)
- Always receive with both hands
- Read the card carefully
- Place it respectfully on the table

## Bowing
- Slight bow for greetings
- Deeper bow for apologies
- Practice proper posture`,
    category: 'business',
    type: 'article',
    level: 'intermediate',
    tags: ['business', 'etiquette', 'culture'],
    author_id: 'admin-1',
    author_name: '管理者 一郎',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: false,
    views: 156,
    likes: 12,
    language: 'en'
  },
  {
    id: '3',
    title: 'プログラミング入門：JavaScript基礎',
    description: 'JavaScriptの基本的な概念と文法を学習します',
    content: `# JavaScript基礎

## 変数の宣言
\`\`\`javascript
let name = "太郎";
const age = 25;
var city = "東京";
\`\`\`

## 関数の定義
\`\`\`javascript
function greet(name) {
  return "こんにちは、" + name + "さん！";
}
\`\`\``,
    category: 'technology',
    type: 'course',
    level: 'beginner',
    tags: ['プログラミング', 'JavaScript', '入門'],
    author_id: 'dev-1',
    author_name: 'Developer User',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: true,
    views: 89,
    likes: 7,
    language: 'ja'
  },
  // 既存のハードコーディングされたリソースをCMS形式に変換
  {
    id: '4',
    title: 'React Native完全ガイド',
    description: 'React Nativeの基礎から応用まで、実践的なサンプルコードと共に学習できる包括的なチュートリアルです。',
    content: `# React Native完全ガイド

## React Nativeとは
React Nativeは、Facebookが開発したクロスプラットフォームモバイルアプリ開発フレームワークです。

## 基本的なコンポーネント
- View: レイアウトの基本要素
- Text: テキスト表示
- Image: 画像表示
- ScrollView: スクロール可能なビュー

## ナビゲーション
React Navigationを使用してアプリ内のナビゲーションを実装します。

## 状態管理
- useState: ローカル状態管理
- useContext: グローバル状態管理
- Redux: 複雑な状態管理

## 外部リンク
[React Native公式ドキュメント](https://reactnative.dev/)`,
    category: 'technology',
    type: 'course',
    level: 'intermediate',
    tags: ['React Native', 'Mobile', 'JavaScript', 'TypeScript'],
    author_id: 'tech-hub-1',
    author_name: 'Tech Learning Hub',
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: true,
    views: 234,
    likes: 48,
    duration: 480, // 8時間
    language: 'ja',
    file_url: 'https://example.com/react-native-guide'
  },
  {
    id: '5',
    title: 'TypeScript入門講座',
    description: '初心者向けのTypeScript講座。基本的な型システムから実践的な使い方まで動画で学習できます。',
    content: `# TypeScript入門講座

## TypeScriptとは
TypeScriptは、JavaScriptに静的型付けを追加したプログラミング言語です。

## 基本的な型
- string: 文字列型
- number: 数値型
- boolean: 真偽値型
- array: 配列型
- object: オブジェクト型

## インターフェース
\`\`\`typescript
interface User {
  name: string;
  age: number;
  email: string;
}
\`\`\`

## 関数の型定義
\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}
\`\`\`

## ジェネリクス
\`\`\`typescript
function identity<T>(arg: T): T {
  return arg;
}
\`\`\``,
    category: 'technology',
    type: 'video',
    level: 'beginner',
    tags: ['TypeScript', 'JavaScript', 'Programming'],
    author_id: 'code-academy-1',
    author_name: 'Code Academy',
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: false,
    views: 156,
    likes: 46,
    duration: 240, // 4時間
    language: 'ja',
    file_url: 'https://example.com/typescript-course'
  },
  {
    id: '6',
    title: 'Expo公式ドキュメント',
    description: 'Expoの公式ドキュメント。最新の機能やAPIリファレンスを確認できます。',
    content: `# Expo公式ドキュメント

## Expoとは
Expoは、React Nativeアプリの開発、ビルド、デプロイを簡単にするプラットフォームです。

## 主な機能
- Expo CLI: コマンドラインツール
- Expo SDK: 豊富なAPIライブラリ
- Expo Go: 開発用アプリ
- EAS Build: クラウドビルドサービス

## 開発の流れ
1. プロジェクト作成
2. 開発・テスト
3. ビルド
4. デプロイ

## 便利なAPI
- Camera: カメラ機能
- Location: 位置情報
- Notifications: プッシュ通知
- FileSystem: ファイル操作

詳細は公式ドキュメントをご確認ください。`,
    category: 'technology',
    type: 'document',
    level: 'intermediate',
    tags: ['Expo', 'React Native', 'Documentation'],
    author_id: 'expo-team-1',
    author_name: 'Expo Team',
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: false,
    views: 89,
    likes: 49,
    language: 'en',
    file_url: 'https://docs.expo.dev'
  },
  {
    id: '7',
    title: 'AI・機械学習実践ハンドブック',
    description: 'Pythonを使った機械学習の実装方法を詳しく解説した電子書籍です。',
    content: `# AI・機械学習実践ハンドブック

## 機械学習の基礎
機械学習は、データからパターンを学習し、予測や分類を行う技術です。

## 主要なライブラリ
- NumPy: 数値計算
- Pandas: データ操作
- Scikit-learn: 機械学習
- TensorFlow: ディープラーニング
- PyTorch: ディープラーニング

## 機械学習の種類
1. 教師あり学習
   - 分類
   - 回帰
2. 教師なし学習
   - クラスタリング
   - 次元削減
3. 強化学習

## 実践例
\`\`\`python
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression

# データ読み込み
data = pd.read_csv('data.csv')

# 特徴量とターゲットに分割
X = data.drop('target', axis=1)
y = data['target']

# 訓練・テストデータに分割
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# モデル訓練
model = LinearRegression()
model.fit(X_train, y_train)

# 予測
predictions = model.predict(X_test)
\`\`\``,
    category: 'technology',
    type: 'document',
    level: 'advanced',
    tags: ['AI', 'Machine Learning', 'Python', 'Data Science'],
    author_id: 'ai-researcher-1',
    author_name: 'Dr. AI Researcher',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: true,
    views: 67,
    likes: 47,
    duration: 1200, // 読了目安: 20時間
    language: 'ja',
    file_url: 'https://example.com/ai-handbook'
  },
  {
    id: '8',
    title: 'VS Code拡張機能集',
    description: '開発効率を向上させるVS Code拡張機能のおすすめリストと設定方法。',
    content: `# VS Code拡張機能集

## 必須拡張機能

### 言語サポート
- **TypeScript Hero**: TypeScript開発支援
- **Python**: Python開発環境
- **ES7+ React/Redux/React-Native snippets**: React開発用スニペット

### コード品質
- **ESLint**: JavaScript/TypeScriptのリンター
- **Prettier**: コードフォーマッター
- **SonarLint**: コード品質チェック

### 開発効率
- **Auto Rename Tag**: HTMLタグの自動リネーム
- **Bracket Pair Colorizer**: 括弧の色分け
- **GitLens**: Git機能拡張
- **Live Server**: ローカルサーバー起動

### テーマ・UI
- **Material Theme**: マテリアルデザインテーマ
- **vscode-icons**: ファイルアイコン
- **Indent Rainbow**: インデントの色分け

## 設定方法
1. VS Codeを開く
2. 拡張機能タブ（Ctrl+Shift+X）を開く
3. 拡張機能名で検索
4. インストールボタンをクリック

## おすすめ設定
\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "prettier.singleQuote": true,
  "prettier.semi": false
}
\`\`\``,
    category: 'technology',
    type: 'article',
    level: 'beginner',
    tags: ['VS Code', 'Tools', 'Productivity', 'Development'],
    author_id: 'dev-tools-1',
    author_name: 'Dev Tools Team',
    created_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: false,
    views: 123,
    likes: 45,
    language: 'ja',
    file_url: 'https://example.com/vscode-extensions'
  },
  {
    id: '9',
    title: 'Web3開発マスターコース',
    description: 'ブロックチェーン技術とスマートコントラクト開発を体系的に学習できるオンラインコースです。',
    content: `# Web3開発マスターコース

## Web3とは
Web3は、ブロックチェーン技術を基盤とした分散型インターネットの概念です。

## 学習内容

### ブロックチェーン基礎
- ブロックチェーンの仕組み
- 暗号化技術
- 分散型ネットワーク
- コンセンサスアルゴリズム

### Ethereum開発
- Ethereumの基礎
- Solidityプログラミング
- スマートコントラクト開発
- DApp（分散型アプリケーション）構築

### 開発ツール
- **Hardhat**: 開発フレームワーク
- **Truffle**: 開発・テストツール
- **MetaMask**: ウォレット連携
- **Web3.js**: JavaScriptライブラリ

## サンプルコード
\`\`\`solidity
pragma solidity ^0.8.0;

contract SimpleStorage {
    uint256 private storedData;
    
    function set(uint256 x) public {
        storedData = x;
    }
    
    function get() public view returns (uint256) {
        return storedData;
    }
}
\`\`\`

## プロジェクト例
1. ERC-20トークン作成
2. NFTマーケットプレイス
3. DeFiプロトコル
4. DAO（分散自律組織）

## 学習期間
12週間の集中コースで、実践的なプロジェクトを通じて学習します。`,
    category: 'technology',
    type: 'course',
    level: 'advanced',
    tags: ['Web3', 'Blockchain', 'Smart Contracts', 'Solidity'],
    author_id: 'blockchain-academy-1',
    author_name: 'Blockchain Academy',
    created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
    published: true,
    featured: true,
    views: 45,
    likes: 49,
    duration: 5040, // 12週間 (分換算)
    language: 'ja',
    file_url: 'https://example.com/web3-course'
  }
];

class ResourceService {
  /**
   * Get all resources with optional filtering
   */
  async getResources(filter?: ResourceFilter): Promise<Resource[]> {
    let filteredResources = [...mockResources];

    if (filter) {
      if (filter.category) {
        filteredResources = filteredResources.filter(r => r.category === filter.category);
      }
      if (filter.type) {
        filteredResources = filteredResources.filter(r => r.type === filter.type);
      }
      if (filter.level) {
        filteredResources = filteredResources.filter(r => r.level === filter.level);
      }
      if (filter.language) {
        filteredResources = filteredResources.filter(r => r.language === filter.language);
      }
      if (filter.featured !== undefined) {
        filteredResources = filteredResources.filter(r => r.featured === filter.featured);
      }
      if (filter.published !== undefined) {
        filteredResources = filteredResources.filter(r => r.published === filter.published);
      }
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filteredResources = filteredResources.filter(r => 
          r.title.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower) ||
          r.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }

    // Sort by created_at descending
    return filteredResources.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * Get a single resource by ID
   */
  async getResource(id: string): Promise<Resource | null> {
    const resource = mockResources.find(r => r.id === id);
    if (resource) {
      // Increment view count
      resource.views += 1;
    }
    return resource || null;
  }

  /**
   * Create a new resource
   */
  async createResource(data: CreateResourceRequest, authorId: string, authorName: string): Promise<Resource> {
    const newResource: Resource = {
      id: Date.now().toString(),
      ...data,
      author_id: authorId,
      author_name: authorName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published: data.published || false,
      featured: data.featured || false,
      views: 0,
      likes: 0
    };

    mockResources.push(newResource);
    console.log('✅ Resource created:', newResource.title);
    return newResource;
  }

  /**
   * Update an existing resource
   */
  async updateResource(data: UpdateResourceRequest): Promise<Resource | null> {
    const index = mockResources.findIndex(r => r.id === data.id);
    if (index === -1) {
      return null;
    }

    const updatedResource = {
      ...mockResources[index],
      ...data,
      updated_at: new Date().toISOString()
    };

    mockResources[index] = updatedResource;
    console.log('✅ Resource updated:', updatedResource.title);
    return updatedResource;
  }

  /**
   * Delete a resource
   */
  async deleteResource(id: string): Promise<boolean> {
    const index = mockResources.findIndex(r => r.id === id);
    if (index === -1) {
      return false;
    }

    mockResources.splice(index, 1);
    console.log('✅ Resource deleted:', id);
    return true;
  }

  /**
   * Toggle like on a resource
   */
  async toggleLike(id: string): Promise<Resource | null> {
    const resource = mockResources.find(r => r.id === id);
    if (!resource) {
      return null;
    }

    // Simple toggle (in real app, would track user likes)
    resource.likes += 1;
    return resource;
  }

  /**
   * Get featured resources
   */
  async getFeaturedResources(): Promise<Resource[]> {
    return this.getResources({ featured: true, published: true });
  }

  /**
   * Get resources by author
   */
  async getResourcesByAuthor(authorId: string): Promise<Resource[]> {
    return mockResources.filter(r => r.author_id === authorId);
  }
}

export const resourceService = new ResourceService();
export default resourceService;