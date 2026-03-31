# Read Later

AIが支えるセルフホスト型の「あとで読む」記事管理ツールです。
自分のサーバーにデプロイして使います。データは完全に自分のものです。

## 特徴

| 機能 | 説明 |
|------|------|
| 記事の保存 | URLを貼るだけ。タイトル・本文・サイト名を自動取得 |
| リーダービュー | 広告やナビを除いたクリーンな本文表示 |
| タグ・お気に入り・既読 | 色付きタグ、お気に入り、既読管理で記事を整理 |
| メモ | 記事ごとにメモを残せる。メモ一覧で振り返り |
| キーワード自動収集 | 気になるワードを登録 → Google Newsから自動で記事を保存（30分ごと） |
| RSSフィード | お気に入りサイトのRSSを登録 → キーワードにマッチした記事だけ保存 |
| AIダイジェスト | 登録キーワードに関する当日のニュースをClaudeが毎朝要約 |
| AIリサーチ | 調べたいことを入力 → Claudeが最新ニュースを検索・分析してレポート生成 |
| 注目度ソート | はてブ数・HNポイント・ドメイン信頼度による独自スコア |
| マルチユーザー | ユーザーIDとパスワードで認証。メールアドレス不要 |
| スマホ対応 | iOSショートカットでSafari共有ボタンからワンタップ保存 |

## 必要なもの

- **Docker** と **Docker Compose**（必須）
- **Claude APIキー**（任意 — AIダイジェスト・リサーチを使う場合のみ）

> Docker未経験の方は [Docker公式サイト](https://docs.docker.com/get-docker/) からインストールしてください。

## セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/Hibiki0419/readlater.git
cd readlater
```

### 2. docker-compose.yml を作成

`readlater` フォルダ内に `docker-compose.yml` を作成してください：

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: readlater
      POSTGRES_USER: readlater
      POSTGRES_PASSWORD: your-db-password    # ← 好きなパスワードに変更
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
      DATABASE_URL: postgresql://readlater:your-db-password@postgres:5432/readlater  # ← 上と同じパスワード
      JWT_SECRET: ここにランダムな文字列を入れる        # ← 変更必須
      CRON_SECRET: ここに別のランダムな文字列を入れる    # ← 変更必須
      # ANTHROPIC_API_KEY: sk-ant-...               # ← AI機能を使う場合のみ
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
        echo "*/30 * * * * wget -qO- --header='X-Cron-Secret: ここに上のCRON_SECRETと同じ値' --post-data= http://readlater:3000/read-later/api/feeds/check > /proc/1/fd/1 2>&1" > /tmp/crontab
        crontab /tmp/crontab
        crond -f -l 2
    depends_on:
      - readlater

volumes:
  pgdata:
```

> **ランダムな文字列の作り方**: ターミナルで `openssl rand -hex 32` を実行するとランダムな文字列が生成されます。

### 3. 起動

```bash
docker compose up -d
```

初回はDockerイメージのビルドに数分かかります。

### 4. データベースを初期化

```bash
docker compose exec readlater npx prisma db push
```

### 5. アカウントを作成

ブラウザで **http://localhost:3000/read-later** を開き、「新規登録」からアカウントを作成します。

- **表示名** — アプリ内で表示される名前
- **ユーザーID** — ログインに使うID（英数字と`_`のみ、3〜20文字）
- **パスワード** — 6文字以上

これで使い始められます。

## 使い方

詳しい使い方は **[GUIDE.md](GUIDE.md)** を参照してください。
記事の保存方法、タグの使い方、キーワード自動収集の設定、AIダイジェスト、iOSショートカットの設定など、すべての機能を図解付きで解説しています。

## 外部公開する場合（リバースプロキシ）

ローカルだけでなくインターネットからアクセスしたい場合は、リバースプロキシを設定します。

### Caddy の例

```
your-domain.com {
    handle /read-later* {
        reverse_proxy readlater:3000
    }
}
```

### Cloudflare Tunnel

ポート開放なしで外部公開できます。[Cloudflare Tunnel ドキュメント](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) を参照してください。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 16 / React 19 / TypeScript / Tailwind CSS v4 |
| バックエンド | Next.js API Routes / Prisma 5 / PostgreSQL 16 |
| 本文抽出 | Mozilla Readability / JSDOM |
| AI | Claude API（Haiku） |
| 認証 | JWT（jose）/ bcrypt / APIトークン |
| インフラ | Docker Compose |

## 開発（コントリビューター向け）

```bash
npm install
cp .env.example .env    # 環境変数を設定
npx prisma db push      # DBスキーマ適用
npm run dev             # 開発サーバー起動
```

## ライセンス

MIT
