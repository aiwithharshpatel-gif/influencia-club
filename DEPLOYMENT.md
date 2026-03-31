# INFLUENZIA CLUB - Deployment Guide

## Production Deployment Options

This guide covers deploying Influenzia Club to production using recommended services.

---

## Recommended Stack (Budget-Friendly)

| Service | Purpose | Cost |
|---------|---------|------|
| **Vercel** | Frontend Hosting | Free |
| **Railway** | Backend + Database | Free tier available |
| **Cloudinary** | Image Storage | Free 25GB |
| **Brevo** | Email Service | Free 300 emails/day |
| **Namecheap/GoDaddy** | Domain | ~₹800/year |

---

## Step 1: Domain Setup

1. Purchase domain: `influenziaclub.in`
2. Configure DNS later after deployment

---

## Step 2: Database Setup (Railway MySQL)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create MySQL Database**
   - Click "New Project"
   - Select "Provision MySQL"
   - Wait for database to be ready

3. **Get Connection String**
   - Click on MySQL service
   - Go to "Connect" tab
   - Copy the `DATABASE_URL`

4. **Run Migrations**
   - Connect your GitHub repo to Railway
   - Add build command: `npx prisma migrate deploy`

---

## Step 3: Backend Deployment (Railway)

1. **Prepare Backend**
   ```bash
   cd backend
   ```

2. **Set Environment Variables in Railway**
   
   In Railway dashboard, add these variables:
   ```env
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your_super_secure_jwt_secret_min_32_chars
   JWT_REFRESH_SECRET=your_super_secure_refresh_secret_min_32_chars
   DATABASE_URL=mysql://user:pass@host.railway.internal:3306/railway
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your_brevo_login
   SMTP_PASS=your_brevo_smtp_key
   EMAIL_FROM=hello@influenziaclub.in
   FRONTEND_URL=https://influenziaclub.in
   REFERRAL_BASE_URL=https://influenziaclub.in/join?ref=
   ```

3. **Deploy**
   - Push code to GitHub
   - Connect Railway to your GitHub repo
   - Set root directory to `backend`
   - Deploy automatically on push

4. **Get Backend URL**
   - Railway provides: `https://your-app.railway.app`
   - Use this for frontend API calls

---

## Step 4: Frontend Deployment (Vercel)

1. **Prepare Frontend**
   ```bash
   cd frontend
   ```

2. **Update API URL**
   
   Create `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-backend.railway.app/api
   ```

3. **Deploy to Vercel**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login
   vercel login

   # Deploy
   cd frontend
   vercel --prod
   ```

4. **Configure in Vercel Dashboard**
   - Set Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Add Environment Variables in Vercel**
   ```env
   VITE_API_URL=https://your-backend.railway.app/api
   ```

---

## Step 5: Configure Cloudinary

1. **Create Account**
   - Go to https://cloudinary.com
   - Sign up for free account

2. **Get Credentials**
   - Dashboard → Settings
   - Copy: Cloud Name, API Key, API Secret

3. **Add to Both Railway and Vercel**

---

## Step 6: Configure Brevo Email

1. **Create Account**
   - Go to https://brevo.com
   - Sign up for free account

2. **Get SMTP Credentials**
   - Settings → SMTP & API
   - Copy SMTP username and password

3. **Verify Sender Email**
   - Add `hello@influenziaclub.in` as sender
   - Verify domain or email

4. **Add to Railway**

---

## Step 7: Configure Domain

### For Vercel (Frontend)

1. Go to Vercel Dashboard
2. Select your project
3. Settings → Domains
4. Add: `influenziaclub.in` and `www.influenziaclub.in`
5. Update DNS at your domain registrar:
   ```
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

### For Railway (Backend)

1. Go to Railway Dashboard
2. Select your project
3. Settings → Domains
4. Add: `api.influenziaclub.in`
5. Update DNS:
   ```
   Type: CNAME
   Name: api
   Value: your-app.railway.app
   ```

---

## Step 8: Update Environment Variables

After domain setup, update:

### Railway (Backend)
```env
FRONTEND_URL=https://influenziaclub.in
REFERRAL_BASE_URL=https://influenziaclub.in/join?ref=
```

### Vercel (Frontend)
```env
VITE_API_URL=https://api.influenziaclub.in/api
```

---

## Step 9: Create Admin User

After deployment, create admin user in Railway MySQL:

1. **Open Railway MySQL Console**
2. **Run:**
   ```sql
   USE railway;
   
   -- Generate password hash using bcrypt (use online tool or Node.js)
   -- Example: bcrypt.hashSync('AdminPassword123', 10)
   
   INSERT INTO admins (id, name, email, password_hash, role) 
   VALUES (
     UUID(),
     'Admin',
     'admin@influenziaclub.in',
     '$2a$10$YourHashedPasswordHere',
     'super_admin'
   );
   ```

---

## Step 10: Test Production

1. **Visit Homepage**
   - `https://influenziaclub.in`

2. **Test Registration**
   - Go to `/join`
   - Register with real email
   - Verify OTP arrives

3. **Test Login**
   - Login with credentials
   - Access dashboard

4. **Test Brand Inquiry**
   - Submit inquiry at `/brands`
   - Check admin email

---

## Alternative: Hostinger VPS Deployment

If using Hostinger VPS:

### 1. SSH into VPS
```bash
ssh root@your-server-ip
```

### 2. Install Dependencies
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt install mysql-server

# Install Nginx
sudo apt install nginx
```

### 3. Setup Database
```bash
mysql -u root -p
CREATE DATABASE influenzia;
EXIT;
```

### 4. Clone and Install
```bash
cd /var/www/influenzia-club
git clone <your-repo> .
npm run install:all
```

### 5. Setup Environment
```bash
cd backend
cp .env.example .env
# Edit .env with your credentials

cd ../frontend
cp .env.example .env
# Edit .env
```

### 6. Build Frontend
```bash
cd frontend
npm run build
```

### 7. Setup PM2
```bash
npm install -g pm2

cd /var/www/influenzia-club/backend
pm2 start src/app.js --name influenzia-api
pm2 save
pm2 startup
```

### 8. Configure Nginx
```nginx
server {
    listen 80;
    server_name influenziaclub.in www.influenziaclub.in;

    location / {
        root /var/www/influenzia-club/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/influenzia /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Setup SSL
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d influenziaclub.in -d www.influenziaclub.in
```

---

## Monitoring & Maintenance

### Logs
- **Railway:** Dashboard → Logs
- **Vercel:** Dashboard → Deployments → Logs
- **Hostinger:** `pm2 logs influenzia-api`

### Database Backups
- **Railway:** Automatic backups
- **Hostinger:** Set up cron job for `mysqldump`

### Uptime Monitoring
- Use UptimeRobot (free) to monitor:
  - `https://influenziaclub.in`
  - `https://api.influenziaclub.in/api/health`

---

## Cost Breakdown (Monthly)

| Service | Free Tier | Paid (if needed) |
|---------|-----------|------------------|
| Vercel | ✅ Free | $20/mo |
| Railway | ✅ $5 credit | $5+/mo |
| Cloudinary | ✅ 25GB | $89/mo |
| Brevo | ✅ 300 emails/day | $25/mo |
| Domain | ❌ ₹800/year | - |
| **Total** | **~₹70/mo** (domain only) | **~₹3000/mo** |

---

## Post-Deployment Checklist

- [ ] Domain DNS configured
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Admin user created
- [ ] Email sending tested
- [ ] Image upload tested
- [ ] All forms working
- [ ] Mobile responsive tested
- [ ] Analytics added (optional)

---

## Support

For deployment issues:
- Railway: https://railway.app/discord
- Vercel: https://vercel.com/docs
- Prisma: https://www.prisma.io/docs

---

**Deployed with ❤️ for Influenzia Club**
Powered by ZCAD Nexoraa Pvt. Ltd.
