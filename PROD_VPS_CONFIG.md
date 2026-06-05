# Hostinger VPS Production Deployment

This is the canonical deployment process for Influenzia Club.

## 1. DNS and Email

In Hostinger hPanel:

1. Create `no-reply@influenziaclub.com` and `hello@influenziaclub.com`.
2. Copy the SMTP hostname and port shown for the mailbox. Hostinger commonly uses `smtp.hostinger.com`, port `465`, SSL enabled.
3. Enable the SPF and DKIM records provided by Hostinger.
4. Add a DMARC record, initially with monitoring:

```text
_dmarc.influenziaclub.com TXT "v=DMARC1; p=none; rua=mailto:hello@influenziaclub.com"
```

Point the root domain and `www` A records to the VPS public IP.

## 2. Prepare Ubuntu

Run as a sudo-enabled user:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y ca-certificates curl nginx certbot python3-certbot-nginx ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
```

Log out and back in after joining the Docker group.

Configure the firewall:

```bash
sudo ufw allow OpenSSH
sudo ufw allow "Nginx Full"
sudo ufw enable
```

Do not expose MySQL or the backend API ports publicly.

## 3. Upload the Application

```bash
sudo mkdir -p /opt/influenzia
sudo chown "$USER":"$USER" /opt/influenzia
cd /opt/influenzia
git clone YOUR_PRIVATE_REPOSITORY_URL .
cp .env.example .env
chmod 600 .env
```

Edit `.env` and replace every placeholder. Generate each application secret separately:

```bash
openssl rand -hex 32
```

The MySQL password used in `DATABASE_URL` must match `MYSQL_PASSWORD`. URL-encode special characters in the URL password.

Required Hostinger mail settings:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=no-reply@influenziaclub.com
SMTP_PASS=YOUR_MAILBOX_PASSWORD
EMAIL_FROM=Influenzia Club <no-reply@influenziaclub.com>
EMAIL_REPLY_TO=hello@influenziaclub.com
SUPPORT_EMAIL=hello@influenziaclub.com
```

Keep these disabled for the initial launch:

```env
PAYMENTS_ENABLED=false
PAYOUTS_ENABLED=false
```

## 4. Build and Start

For a new database:

```bash
docker compose build --pull
docker compose up -d
docker compose ps
docker compose logs --tail=100 backend
```

The backend applies committed Prisma migrations before starting. Never replace this with `prisma db push --accept-data-loss`.

Create the first administrator:

```bash
docker compose exec \
  -e ADMIN_NAME="Platform Admin" \
  -e ADMIN_EMAIL="admin@influenziaclub.com" \
  -e ADMIN_PASSWORD="REPLACE_WITH_A_LONG_UNIQUE_PASSWORD" \
  backend npm run admin:create
```

## 5. Host Nginx and HTTPS

Create `/etc/nginx/sites-available/influenzia`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name influenziaclub.com www.influenziaclub.com;

    client_max_body_size 2m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable it and request TLS:

```bash
sudo ln -s /etc/nginx/sites-available/influenzia /etc/nginx/sites-enabled/influenzia
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d influenziaclub.com -d www.influenziaclub.com
sudo certbot renew --dry-run
```

## 6. Validate the Launch

```bash
curl -fsS https://influenziaclub.com/api/health
curl -fsS https://influenziaclub.com/api/ready
docker compose ps
docker compose logs --tail=100 backend
```

Test:

1. Creator registration and Hostinger-delivered OTP.
2. Login, refresh after 15 minutes, and logout.
3. Forgot-password email and one-time reset.
4. Profile update and dashboard data.
5. Brand inquiry and contact email delivery.
6. Referral points and reward approval.

## 7. Updates and Rollback

Before every update:

```bash
cd /opt/influenzia
BACKUP_DIR=/var/backups/influenzia ./scripts/backup.sh
git pull --ff-only
docker compose build
docker compose up -d
docker compose logs --tail=100 backend
```

Keep database backups outside the VPS as well.

Automate daily backups and copy them to encrypted off-server storage. Test a
restore before launch and at least once per quarter. A backup that has not been
restored successfully is not a verified backup.

To inspect a failed release:

```bash
docker compose ps
docker compose logs backend
docker compose logs frontend
sudo tail -n 200 /var/log/nginx/error.log
```
