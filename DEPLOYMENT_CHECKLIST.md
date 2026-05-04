# INFLUENZIA CLUB - Production Deployment Checklist

## Complete Step-by-Step Guide

---

## 📋 **Pre-Deployment Checklist**

### ✅ Code Ready
- [ ] All features tested locally
- [ ] No console errors in browser
- [ ] API endpoints working
- [ ] Database migrations run successfully
- [ ] `.env` files configured correctly

### ✅ Accounts Created
- [ ] GitHub account (for version control)
- [ ] Railway account (https://railway.app)
- [ ] Vercel account (https://vercel.com)
- [ ] Cloudinary account (https://cloudinary.com)
- [ ] Brevo account (https://brevo.com)
- [ ] Razorpay account (https://razorpay.com)
- [ ] Domain purchased (influenziaclub.com)

### ✅ Environment Variables Ready
```
Create a secure document with all credentials:
- Database URL
- JWT secrets
- Cloudinary credentials
- Brevo SMTP credentials
- Razorpay keys
- Cashfree keys
```

---

## 🎯 **OPTION A: Deploy to Railway + Vercel (RECOMMENDED)**

**Time:** 1-2 hours
**Cost:** Free tier initially
**Difficulty:** Easy

---

### **STEP 1: Prepare GitHub Repository** (15 min)

```bash
# Navigate to project
cd "D:\Projects\Influenzia Club\Building with Qwen CLI"

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Influenzia Club v1.0"

# Create repository on GitHub
# Go to github.com → New Repository → "influenzia-club"
# Copy the remote URL

# Connect and push
git remote add origin https://github.com/YOUR_USERNAME/influenzia-club.git
git branch -M main
git push -u origin main
```

---

### **STEP 2: Setup Railway MySQL Database** (20 min)

1. **Go to Railway.app**
   - Sign in with GitHub
   - Click "New Project"
   - Select "New MySQL"

2. **Wait for Database to Provision**
   - Takes 2-3 minutes
   - You'll see MySQL service in dashboard

3. **Get Connection String**
   - Click on MySQL service
   - Go to "Connect" tab
   - Click "Copy Connection String"
   - Save this for later (DATABASE_URL)

4. **Create Database Schema**
   ```bash
   # In Railway MySQL console (or use MySQL Workbench)
   CREATE DATABASE influenzia;
   ```

---

### **STEP 3: Deploy Backend to Railway** (30 min)

1. **Connect GitHub Repo**
   - In Railway dashboard
   - Click "New" → "GitHub Repo"
   - Select "influenzia-club"
   - Railway auto-detects it's a Node.js app

2. **Configure Root Directory**
   - Click on your service
   - Go to "Settings"
   - Set "Root Directory" to: `backend`

3. **Set Environment Variables**
   In Railway dashboard → Variables → Add these:

   ```env
   # Server
   PORT=5000
   NODE_ENV=production
   
   # JWT Secrets (generate new secure ones!)
   JWT_SECRET=your_super_secure_jwt_secret_min_32_chars_random
   JWT_REFRESH_SECRET=your_super_secure_refresh_secret_min_32_chars_random
   
   # Database (from Railway MySQL)
   DATABASE_URL=mysql://user:password@host.railway.internal:3306/railway
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Brevo SMTP
   SMTP_HOST=smtp-relay.brevo.com
   SMTP_PORT=587
   SMTP_USER=your_brevo_username
   SMTP_PASS=your_brevo_password
   EMAIL_FROM=hello@influenziaclub.com
   
   # Razorpay
   RAZORPAY_KEY_ID=rzp_live_your_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   
   # Cashfree
   CASHFREE_APP_ID=your_app_id
   CASHFREE_SECRET_KEY=your_secret_key
   
   # App URLs
   FRONTEND_URL=https://influenziaclub.com
   REFERRAL_BASE_URL=https://influenziaclub.com/join?ref=
   ```

4. **Add Build Command**
   ```
   npx prisma migrate deploy && npx prisma generate
   ```

5. **Deploy!**
   - Railway will automatically build and deploy
   - Takes 3-5 minutes
   - You'll see "Deployed" status

6. **Get Backend URL**
   - Click "Settings" → "Domains"
   - Railway provides: `https://your-app.up.railway.app`
   - Save this URL

---

### **STEP 4: Run Database Migrations** (10 min)

```bash
# In Railway dashboard
# Go to your MySQL service
# Click "Open Console"

# Or use Railway CLI:
npm i -g @railway/cli
railway login
railway run npx prisma migrate deploy
railway run npx prisma generate
```

**Alternative (Manual):**
```bash
# In your backend folder locally
# Update .env with Railway DATABASE_URL
npx prisma migrate deploy
npx prisma generate
```

---

### **STEP 5: Deploy Frontend to Vercel** (20 min)

1. **Install Vercel CLI** (optional)
   ```bash
   npm i -g vercel
   ```

2. **Deploy via Dashboard** (easier)
   - Go to vercel.com
   - Sign in with GitHub
   - Click "Add New Project"
   - Import "influenzia-club" repository
   - Configure:
     ```
     Root Directory: frontend
     Build Command: npm run build
     Output Directory: dist
     ```

3. **Set Environment Variables in Vercel**
   ```env
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```

4. **Deploy!**
   - Click "Deploy"
   - Takes 2-3 minutes
   - You'll get: `https://influenzia-club.vercel.app`

---

### **STEP 6: Configure Custom Domain** (30 min)

#### For Vercel (Frontend):

1. **Buy Domain** (if not already)
   - Namecheap, GoDaddy, or Google Domains
   - Recommended: `influenziaclub.com`

2. **Add Domain to Vercel**
   - Vercel Dashboard → Your Project
   - Settings → Domains
   - Add: `influenziaclub.com`
   - Add: `www.influenziaclub.com`

3. **Update DNS at Domain Registrar**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

4. **Wait for DNS Propagation**
   - Takes 15 min to 48 hours
   - Usually completes in 1-2 hours
   - Check: https://dnschecker.org

#### For Railway (Backend):

1. **Add Custom Domain**
   - Railway Dashboard → Your Service
   - Settings → Domains
   - Add: `api.influenziaclub.com`

2. **Update DNS**
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   ```

3. **Update Environment Variables**
   ```env
   # In Railway
   FRONTEND_URL=https://influenziaclub.com
   REFERRAL_BASE_URL=https://influenziaclub.com/join?ref=
   
   # In Vercel
   VITE_API_URL=https://api.influenziaclub.com/api
   ```

---

### **STEP 7: Setup SSL Certificates** (Automatic)

**Vercel:** Auto-provisions SSL via Let's Encrypt
**Railway:** Auto-provisions SSL via Let's Encrypt

No action needed! Just wait 5-10 minutes after DNS propagation.

---

### **STEP 8: Create Admin User** (10 min)

```sql
-- In Railway MySQL Console

USE railway;

-- First, generate a password hash
-- Use this Node.js snippet locally:
-- const bcrypt = require('bcryptjs');
-- console.log(bcrypt.hashSync('YourSecurePassword123', 10));

INSERT INTO admins (id, name, email, password_hash, role) 
VALUES (
  UUID(),
  'Admin',
  'admin@influenziaclub.com',
  '$2a$10$YourHashedPasswordHere',
  'super_admin'
);
```

---

### **STEP 9: Test Production Deployment** (15 min)

#### Test Checklist:

```
□ Visit https://influenziaclub.com
  → Homepage loads correctly
  → All images load
  → No console errors

□ Test Registration
  → Go to /join
  → Fill form with real email
  → Check if OTP email arrives
  → Verify OTP
  → Check if redirected to dashboard

□ Test Login
  → Go to /login
  → Login with test account
  → Check if redirected to dashboard

□ Test Creator Profile
  → Complete profile
  → Upload photo (if Cloudinary configured)
  → Save changes

□ Test Brand Inquiry
  → Go to /brands
  → Submit inquiry
  → Check if admin email receives notification

□ Test API Health
  → Visit: https://api.influenziaclub.com/api/health
  → Should return: {"status": "ok"}
```

---

### **STEP 10: Setup Monitoring** (15 min)

#### 1. Uptime Monitoring (UptimeRobot - Free)
```
1. Go to uptimerobot.com
2. Create account
3. Add 2 monitors:
   - https://influenziaclub.com
   - https://api.influenziaclub.com/api/health
4. Set interval: 5 minutes
5. Get email alerts when down
```

#### 2. Google Analytics
```
1. Go to analytics.google.com
2. Create property: "Influenzia Club"
3. Get Measurement ID (G-XXXXXXXXXX)
4. Add to frontend/index.html (see QUICK_WINS.md)
```

#### 3. Error Tracking (Optional - Sentry)
```
1. Go to sentry.io
2. Create account
3. Install @sentry/react in frontend
4. Initialize with DSN
```

---

## 🎯 **OPTION B: Deploy to Hostinger VPS**

**Time:** 2-3 hours
**Cost:** ₹300-500/month
**Difficulty:** Medium

---

### **STEP 1: SSH into VPS**

```bash
ssh root@your-server-ip
# Enter password
```

---

### **STEP 2: Install Dependencies**

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install MySQL
apt install -y mysql-server

# Install Nginx
apt install -y nginx

# Install Git
apt install -y git

# Install PM2
npm install -g pm2
```

---

### **STEP 3: Setup Database**

```bash
mysql -u root -p

# In MySQL:
CREATE DATABASE influenzia;
CREATE USER 'influenzia_user'@'localhost' IDENTIFIED BY 'strong_password';
GRANT ALL PRIVILEGES ON influenzia.* TO 'influenzia_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### **STEP 4: Clone and Setup Project**

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/influenzia-club.git
cd influenzia-club

# Install dependencies
npm run install:all

# Setup backend .env
cd backend
cp .env.example .env
nano .env
# Edit with your credentials

# Run migrations
npx prisma migrate deploy
npx prisma generate

# Build frontend
cd ../frontend
npm run build
```

---

### **STEP 5: Configure Nginx**

```bash
nano /etc/nginx/sites-available/influenzia
```

**Add this config:**

```nginx
server {
    listen 80;
    server_name influenziaclub.com www.influenziaclub.com;

    # Frontend
    location / {
        root /var/www/influenzia-club/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

**Enable site:**
```bash
ln -s /etc/nginx/sites-available/influenzia /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

### **STEP 6: Start Backend with PM2**

```bash
cd /var/www/influenzia-club/backend
pm2 start src/app.js --name influenzia-api
pm2 save
pm2 startup
# Copy the command it gives you and run it
```

---

### **STEP 7: Setup SSL**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d influenziaclub.com -d www.influenziaclub.com
```

**Auto-renewal:**
```bash
certbot renew --dry-run
```

---

### **STEP 8: Configure Firewall**

```bash
ufw allow 'Nginx Full'
ufw allow OpenSSH
ufw enable
ufw status
```

---

## 📊 **Post-Deployment Checklist**

### ✅ Security
```
□ Change all default passwords
□ Enable 2FA on all accounts (Railway, Vercel, etc.)
□ Restrict database access (whitelist IPs if possible)
□ Setup regular backups
□ Review CORS settings
```

### ✅ Performance
```
□ Enable CDN (Cloudflare free tier)
□ Compress images (use TinyPNG)
□ Enable gzip in Nginx
□ Setup caching headers
□ Test page speed (pagespeed.web.dev)
```

### ✅ Backups
```
□ Database: Daily automated backups
□ Code: GitHub (already done)
□ Environment variables: Secure offline backup
□ Media: Cloudinary (automatic)
```

### ✅ Documentation
```
□ Update README with production URLs
□ Document all credentials securely
□ Create runbook for common issues
□ Setup status page (optional)
```

---

## 🎉 **Deployment Complete! Next Steps:**

### **Immediate (Today):**
```
□ Test all critical flows
□ Send test emails
□ Process test payment (Razorpay test mode)
□ Create admin account
□ Add first 5 creator profiles manually
```

### **This Week:**
```
□ Switch Razorpay to live mode
□ Setup email templates
□ Create social media posts
□ Start creator outreach
□ Start brand outreach
```

### **Ongoing:**
```
□ Monitor uptime (UptimeRobot)
□ Check analytics daily
□ Respond to support queries
□ Fix bugs as they arise
□ Iterate based on feedback
```

---

## 🆘 **Troubleshooting Common Issues**

### Issue: Frontend shows blank page
```
Solution:
1. Check browser console for errors
2. Verify VITE_API_URL is correct
3. Check if backend is running
4. Clear browser cache
```

### Issue: API requests failing
```
Solution:
1. Check Railway logs for errors
2. Verify DATABASE_URL is correct
3. Check if migrations ran successfully
4. Ensure all environment variables are set
```

### Issue: Emails not sending
```
Solution:
1. Verify Brevo SMTP credentials
2. Check if sender email is verified in Brevo
3. Look at Railway logs for email errors
4. Test with Brevo's test email feature
```

### Issue: Database connection errors
```
Solution:
1. Check Railway MySQL is running
2. Verify DATABASE_URL format
3. Ensure migrations completed
4. Check Railway logs for database errors
```

### Issue: Domain not working
```
Solution:
1. Wait 24-48 hours for DNS propagation
2. Check DNS with dnschecker.org
3. Clear local DNS cache
4. Try incognito mode
```

---

## 📞 **Support Resources**

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Prisma Docs:** https://prisma.io/docs
- **Railway Discord:** https://discord.gg/railway
- **Vercel Community:** https://vercel.community

---

## 🎯 **Ready to Deploy?**

**Tell me when you're ready and I'll:**
1. Guide you through each step
2. Help troubleshoot any issues
3. Verify deployment is successful
4. Setup monitoring

**Or if you prefer, I can create:**
- Automated deployment scripts
- CI/CD configuration
- Backup automation
- Monitoring dashboards

---

**Let's get Influenzia Club live! 🚀**

*Deployment Guide - March 2026*
