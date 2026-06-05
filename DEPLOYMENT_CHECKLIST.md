# Production Checklist

- [ ] Domain A records point to the Hostinger VPS.
- [ ] Hostinger mailboxes exist and SMTP credentials are tested.
- [ ] SPF, DKIM, and DMARC records are published.
- [ ] `.env` contains no placeholder values and is mode `600`.
- [ ] JWT and OTP secrets are independent random values.
- [ ] `PAYMENTS_ENABLED=false` and `PAYOUTS_ENABLED=false` for initial launch.
- [ ] `docker compose build --pull` succeeds.
- [ ] Database migrations complete without `db push`.
- [ ] The first administrator is created with `npm run admin:create`.
- [ ] Host Nginx proxies to `127.0.0.1:8080`.
- [ ] Let's Encrypt HTTPS and renewal are working.
- [ ] `/api/health` returns HTTP 200 over HTTPS.
- [ ] Registration, OTP, login, logout, and password reset are tested.
- [ ] Creator moderation works at `/admin`.
- [ ] Brand inquiry and contact emails reach `SUPPORT_EMAIL`.
- [ ] Database backups are stored outside the VPS.

Detailed commands: [PROD_VPS_CONFIG.md](./PROD_VPS_CONFIG.md).
