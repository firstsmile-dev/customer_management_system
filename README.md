# Customer Management System

顧客・店舗・スタッフ・来店記録・日次売上・経費を管理するWebアプリケーションです。ロールに応じたアクセス制御と店舗単位のデータスコープに対応しています。

## 技術スタック

- **バックエンド:** Django 6, Django REST Framework, Simple JWT (認証), PostgreSQL
- **フロントエンド:** React 19, TypeScript, React Router, Axios, Tailwind CSS
- **DB:** PostgreSQL（開発時は SQLite への切り替えも可能）

## 主な機能

- **認証:** メール・パスワードでのログイン、JWT（access/refresh）、新規登録（初回は管理者、以降はキャストとして店舗選択）
- **ロール:** Cast / Staff / Manager / Admin。ロールごとに閲覧・編集可能なページが異なります
- **店舗スコープ:** 管理者は全店舗、それ以外は自店舗のデータのみ表示・編集
- **顧客:** 顧客一覧・登録・編集・削除、詳細（プロフィール・詳細・嗜好）のモーダル登録・編集
- **来店記録:** 来店記録のCRUD
- **日次売上:** 来店記録の利用額を店舗・日付で集計して表示（参照専用）
- **日次経費:** 日次サマリー（売上・経費・人件費・備考）の登録・編集・削除
- **店舗管理:** 店舗のCRUD（新規登録は管理者のみ）
- **ユーザー管理:** ユーザー（キャスト・スタッフ・マネージャー・管理者）のCRUD、店舗割り当て
- **スタッフ管理:** スタッフ（ユーザー×店舗）のCRUD。店舗は自店舗のみ、キャストはその店舗に属するユーザーのみ選択可能
- **マイページ:** ログイン中のユーザー情報、目標・売上サンプル表示、メール・パスワード変更
- **レスポンシブ:** 768px未満でヘッダーがハンバーガーメニュー、テーブルは横スクロールで単行表示

## 前提環境

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+（または SQLite で簡易稼働）
- （推奨）venv / virtualenv

## セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd customer_management_system
```

### 2. バックエンド（Django API）

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**PostgreSQL を使う場合:**

1. データベースとユーザーを作成します。

   ```bash
   sudo -u postgres psql
   CREATE USER cms_user WITH PASSWORD 'secure_password_here';
   CREATE DATABASE customer_management_db OWNER cms_user;
   \c customer_management_db
   GRANT USAGE, CREATE ON SCHEMA public TO cms_user;
   \q
   ```

2. `backend/backend/settings.py` の `DATABASES` で `PASSWORD` 等を環境に合わせて変更します。

**マイグレーション:**

```bash
python manage.py migrate
```

**開発サーバー起動:**

```bash
python manage.py runserver
# API: http://localhost:8000
```

### 3. フロントエンド（React）

別ターミナルで:

```bash
cd frontend
npm install
npm start
# ブラウザ: http://localhost:3000
```

フロントは `package.json` の proxy で `http://localhost:8000` にAPIリクエストを送ります。バックエンドを先に起動しておいてください。

## データベースの再構築

既存DBを削除してマイグレーションからやり直す手順は以下を参照してください。

- [backend/scripts/README_REBUILD_DB.md](backend/scripts/README_REBUILD_DB.md)
- スクリプト実行: `./backend/scripts/rebuild_db.sh`（PostgreSQL の superuser で実行）

## API 概要

- **ベースURL:** `http://localhost:8000/api/`（フロントは `/api` にプロキシ）
- **認証:** `POST /api/auth/login/`（email, password）→ access/refresh トークン
- **登録:** `POST /api/auth/register/`（username, email, password, store）
- **トークン更新:** `POST /api/auth/refresh/`（refresh）
- **REST リソース:**  
  `stores`, `users`, `customers`, `staff-members`, `visit-records`,  
  `customer-profiles`, `customer-details`, `customer-preferences`,  
  `performance-targets`, `daily-summaries`

認証済みリクエストではヘッダーに `Authorization: Bearer <access>` を付与してください。管理者は全店舗、それ以外は自店舗のデータのみアクセス可能です。

## ロールとアクセス

| ロール   | 主なアクセス先 |
|----------|----------------|
| Cast     | ホーム, 顧客一覧・登録, 来店記録, マイページ |
| Staff    | 上記 + 日次売上, 日次経費, スタッフ管理 |
| Manager  | Staff + 店舗管理（自店舗の表示・編集） |
| Admin    | 全ページ・全店舗、店舗新規作成・ユーザー管理 |

## プロジェクト構成

```
customer_management_system/
├── backend/                 # Django API
│   ├── api/                 # アプリ: models, views, serializers, urls, auth
│   ├── backend/             # 設定 (settings.py)# customer-management-system

│   ├── scripts/             # DB再構築スクリプト・説明
│   ├── manage.py
│   └── requirements.txt
├── frontend/                # React SPA
│   ├── public/
│   ├── src/
│   │   ├── components/      # 共通コンポーネント・モーダル
│   │   ├── contexts/        # AuthContext
│   │   ├── pages/           # 各画面
│   │   ├── types/           # TypeScript 型
│   │   └── utils/           # エラーメッセージ等
│   └── package.json
└── README.md
```

## ライセンス

このプロジェクトのライセンスはリポジトリの記載に従います。
