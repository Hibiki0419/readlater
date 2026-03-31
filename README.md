# Read Later

AIが支えるセルフホスト型の「あとで読む」記事管理ツールです。

## 機能

- **記事の保存・管理** — URLを貼るだけでタイトル・本文を自動取得。タグ・お気に入り・既読管理
- **リーダービュー** — 広告のないクリーンな本文表示（Mozilla Readability）
- **キーワード自動収集** — 登録したキーワードでGoogle Newsを30分ごとに自動巡回・保存
- **RSSフィード対応** — サイトURLからRSSを自動検出。キーワードにマッチした記事だけ保存
- **AIダイジェスト** — 毎朝、キーワードに関する当日のニュースをClaudeが要約
- **AIリサーチ** — 調べたいことを入力するとClaudeがニュースを検索・分析してレポート生成
- **メモ** — 記事ごとにメモを残し、まとめて閲覧
- **注目度スコア** — はてブ数・HNポイント・ドメイン信頼度による独自スコアでソート
- **マルチユーザー** — ユーザーIDとパスワードで認証。メールアドレス不要
- **スマートフォン対応** — iOSショートカットでSafariの共有ボタンからワンタップ保存

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 |
| バックエンド | Next.js API Routes / Prisma 5 / PostgreSQL 16 |
| 本文抽出 | Mozilla Readability / JSDOM |
| AI | Claude API（Haiku） |
| 認証 | JWT（jose）/ bcrypt / APIトークン |
| インフラ | Docker Compose |

## セットアップ

### 必要なもの

- Docker & Docker Compose
- （任意）Claude APIキー（AIダイジェスト・リサーチを使う場合）

### 手順

```bash
git clone https://github.com/Hibiki0419/readlater.git
cd readlater
cp .env.example .env
```

`.env` を編集：

```env
DATABASE_URL=postgresql://readlater:your-db-password@postgres:5432/readlater
JWT_SECRET=ランダムな文字列を設定してください
CRON_SECRET=別のランダムな文字列を設定してください
ANTHROPIC_API_KEY=sk-ant-...（任意）
```

起動：

```bash
docker compose up -d
```

ブラウザで `http://localhost:3000` を開き、アカウントを作成してください。

### Docker Compose 構成例

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: readlater
      POSTGRES_USER: readlater
      POSTGRES_PASSWORD: your-db-password
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U readlater"]
      interval: 5s
      timeout: 3s
      retries: 5

  readlater:
    build: .
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://readlater:your-db-password@postgres:5432/readlater
      JWT_SECRET: ランダムな文字列
      CRON_SECRET: 別のランダムな文字列
      ANTHROPIC_API_KEY: sk-ant-...
    depends_on:
      postgres:
        condition: service_healthy

  feed-cron:
    image: alpine:3.19
    restart: unless-stopped
    entrypoint: /bin/sh
    command:
      - -c
      - |
        echo "*/30 * * * * wget -qO- --header='X-Cron-Secret: 上のCRON_SECRETと同じ値' --post-data= http://readlater:3000/read-later/api/feeds/check > /proc/1/fd/1 2>&1" > /tmp/crontab
        echo "0 22 * * * wget -qO- --header='X-Cron-Secret: 上のCRON_SECRETと同じ値' --post-data= http://readlater:3000/read-later/api/digest/generate > /proc/1/fd/1 2>&1" >> /tmp/crontab
        crontab /tmp/crontab
        crond -f -l 2
    depends_on:
      - readlater

volumes:
  pgdata:
```

### データベースの初期化

初回起動後にスキーマを適用します：

```bash
docker compose exec readlater npx prisma db push
```

## 環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL接続文字列 | はい |
| `JWT_SECRET` | JWTトークンの署名に使うシークレット | はい |
| `CRON_SECRET` | 自動巡回の認証シークレット | はい |
| `ANTHROPIC_API_KEY` | Claude APIキー | いいえ（AI機能を使う場合のみ） |

## iOSショートカットの設定

Safariの共有ボタンからワンタップで記事を保存できます。

1. ショートカットアプリで新規作成
2. 「URLの内容を取得」アクションを追加
3. 設定：
   - **URL**: `https://あなたのドメイン/read-later/api/articles`
   - **方法**: POST
   - **ヘッダ**: `Content-Type` → `application/json`、`Authorization` → `Bearer あなたのAPIトークン`
   - **本文（JSON）**: キー `url` → 値「ショートカットの入力」
4. 共有シートに表示をON、入力タイプをURLのみに設定

APIトークンはアプリの設定画面で確認できます。

## リバースプロキシ

Caddy での設定例：

```
your-domain.com {
    handle /read-later* {
        reverse_proxy readlater:3000
    }
}
```

## ドキュメント

詳しい使い方は [GUIDE.md](GUIDE.md) を参照してください。

## 開発

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## ライセンス

MIT
