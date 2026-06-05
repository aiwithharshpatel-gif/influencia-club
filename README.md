# Influenzia Club

Creator and brand collaboration platform built with React, Express, Prisma, and MySQL.

## Production Stack

- React 18 and Vite 7
- Express API with secure HTTP-only JWT cookies
- Prisma ORM and MySQL 8.4
- Hostinger SMTP through Nodemailer
- Docker Compose behind host Nginx and Let's Encrypt

## Local Development

Requirements: Node.js 20.19+ and MySQL 8.

```bash
npm run install:all
cp backend/.env.example backend/.env
npm run prisma:generate
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` to the backend.

## Production Deployment

Use [PROD_VPS_CONFIG.md](./PROD_VPS_CONFIG.md) as the canonical Hostinger VPS guide.

Important production behavior:

- Startup runs `prisma migrate deploy`; it never uses `db push --accept-data-loss`.
- The API refuses to start when required production secrets or SMTP settings are missing.
- Hostinger SMTP is verified before the API starts accepting traffic.
- Refresh sessions are stored as one-way hashes and rotated on every refresh.
- `/api/ready` checks database connectivity for deployment health checks.
- Payments and payouts are disabled by default.
- Financial routes do not use mock provider responses.

## Verification

```bash
npm run check
docker compose config
```

## Environment

Copy `.env.example` to `.env` only on the server. Never commit `.env`.

Generate independent secrets:

```bash
openssl rand -hex 32
```

## License

Copyright 2026 ZCAD Nexoraa Pvt. Ltd.
