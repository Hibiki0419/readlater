# Read Later

A self-hosted "read it later" app with automatic article collection.

## Features

- **Save articles** - Paste a URL or share from your phone
- **Reader view** - Clean article reading powered by Mozilla Readability
- **Tags** - Organize articles with color-coded tags
- **Auto-collection** - Set keywords and RSS feeds to automatically find and save articles
  - Google News keyword monitoring
  - RSS/Atom feed support with keyword filtering
  - RSS auto-discovery from site URLs
  - Runs every 30 minutes
- **Multi-user** - Each user has their own articles, tags, and settings
- **Mobile-friendly** - PWA support, iOS Shortcut integration
- **Self-hosted** - Docker Compose, no external services required

## Tech Stack

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS v4
- **Backend**: Next.js API Routes + Prisma 5
- **Database**: PostgreSQL 16
- **Auth**: JWT (jose) + bcrypt
- **Content**: Mozilla Readability + JSDOM
- **Infrastructure**: Docker Compose + Caddy

## Quick Start

```bash
git clone https://github.com/Hibiki0419/readlater.git
cd readlater
cp .env.example .env  # Edit as needed
docker compose up -d
```

Open `http://localhost:3000` and create your account.

## Docker Compose (Recommended)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: readlater
      POSTGRES_USER: readlater
      POSTGRES_PASSWORD: change-me
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
      DATABASE_URL: postgresql://readlater:change-me@postgres:5432/readlater
      JWT_SECRET: generate-a-random-string-here
      CRON_SECRET: generate-another-random-string
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
        echo "*/30 * * * * wget -qO- --header='X-Cron-Secret: generate-another-random-string' --post-data= http://readlater:3000/read-later/api/feeds/check > /proc/1/fd/1 2>&1" | crontab -
        crond -f -l 2
    depends_on:
      - readlater

volumes:
  pgdata:
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret for JWT token signing | `change-me-in-production` |
| `CRON_SECRET` | Secret for cron feed checker | Required for auto-collection |

## Database Setup

On first run, Prisma will need to set up the database:

```bash
docker compose exec readlater npx prisma db push
```

Or apply migrations:

```bash
docker compose exec readlater npx prisma migrate deploy
```

## iOS Shortcut Setup

To save articles from Safari's share sheet:

1. Open the **Shortcuts** app
2. Create a new shortcut
3. Add action: **Get Contents of URL**
4. Configure:
   - **URL**: `https://your-domain/read-later/api/articles`
   - **Method**: POST
   - **Headers**:
     - `Content-Type`: `application/json`
     - `Authorization`: `Bearer YOUR_API_TOKEN`
   - **Body** (JSON): key `url`, value: **Shortcut Input**
5. Set the shortcut to accept **URLs** from the **Share Sheet**
6. Name it "Read Later"

Your API token can be found in the app's Settings page.

## Reverse Proxy

If using a reverse proxy (Caddy, Nginx, etc.), proxy `/read-later*` to `readlater:3000`.

Caddy example:
```
your-domain.com {
    handle /read-later* {
        reverse_proxy readlater:3000
    }
}
```

## Development

```bash
npm install
cp .env.example .env
npx prisma db push
npm run dev
```

## Documentation

Detailed usage guide: [GUIDE.md](GUIDE.md)

## License

MIT
