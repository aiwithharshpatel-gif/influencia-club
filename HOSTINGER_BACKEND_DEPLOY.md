# Hostinger Backend Deployment Guide

## Deploy Backend on Same Hostinger Account

---

## Option A: Subdomain Setup (Recommended)

### Step 1: Create Subdomain

1. Login to **hPanel**
2. Go to **Domains** → **Subdomains**
3. Create new subdomain:
   - **Subdomain:** `api`
   - **Domain:** `test.digiglowmarketing.in`
   - **Directory:** `api` (or leave default)

4. Click **Create**

---

### Step 2: Setup Node.js App for Backend

1. Go to **Node.js** in hPanel
2. Click **Create Application**
3. Configure:

| Setting | Value |
|---------|-------|
| **Node.js Version** | 18.x or 20.x |
| **Application Root** | `backend` |
| **Application URL** | `api.test.digiglowmarketing.in` |
| **Startup File** | `src/app.js` |
| **Application Mode** | `production` |
| **Build Command** | `npm install && npx prisma generate` |

---

### Step 3: Create MySQL Database

1. Go to **Databases** → **MySQL Databases**
2. Create new database:
   - **Database Name:** `influenzia_db`
   - **Username:** Create new user
   - **Password:** Generate strong password
3. **Save these credentials!**

---

### Step 4: Set Environment Variables

In Node.js configuration, add these variables:

```
NODE_ENV=production
PORT=3000

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=influenzia_super_secure_jwt_secret_2026_change_this
JWT_REFRESH_SECRET=influenzia_refresh_token_secret_2026_change_this

# Database (Update with your Hostinger MySQL)
DATABASE_URL=mysql://username:password@localhost:3306/database_name

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Brevo SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_username
SMTP_PASS=your_brevo_password
EMAIL_FROM=hello@influenziaclub.in

# Frontend URL
FRONTEND_URL=https://test.digiglowmarketing.in
REFERRAL_BASE_URL=https://test.digiglowmarketing.in/join?ref=

# Razorpay (Optional)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_secret

# Cashfree (Optional)
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
```

---

### Step 5: Deploy from GitHub

1. In Node.js app settings
2. Select **Deploy from Git** (if available)
3. Connect repository: `aiwithharshpatel-gif/influencia-club`
4. Branch: `main`
5. Click **Deploy**

**Or upload files manually:**
1. Download backend folder from GitHub
2. Upload to Hostinger File Manager in `backend` folder

---

### Step 6: Run Database Migrations

If SSH access is available:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

**Or manually create tables** using phpMyAdmin with the schema from `backend/prisma/schema.prisma`

---

### Step 7: Test Backend API

Visit: `https://api.test.digiglowmarketing.in/api/health`

Should return:
```json
{
  "status": "OK",
  "timestamp": "..."
}
```

---

### Step 8: Update Frontend API URL

1. Go to **Vercel Dashboard** → Your frontend project
2. Settings → **Environment Variables**
3. Edit `VITE_API_URL`:
   ```
   VITE_API_URL=https://api.test.digiglowmarketing.in/api
   ```
4. Click **Save**
5. **Redeploy** frontend

---

## Option B: Same App (Advanced)

Run both frontend and backend from single Node.js app:

### Modify startup.js to include backend routes:

```javascript
// At top of startup.js
const backendApp = require('./backend/src/app.js');

// Proxy API requests to backend
if (req.url.startsWith('/api')) {
  backendApp(req, res);
  return;
}
```

**Not recommended** - harder to manage and debug.

---

## Environment Variables Checklist

### Required for Backend:

| Variable | Required | Notes |
|----------|----------|-------|
| `NODE_ENV` | ✅ | `production` |
| `PORT` | ✅ | Auto-set by Hostinger |
| `JWT_SECRET` | ✅ | Random 32+ chars |
| `JWT_REFRESH_SECRET` | ✅ | Random 32+ chars |
| `DATABASE_URL` | ✅ | MySQL connection string |
| `CLOUDINARY_*` | ⚠️ | For image uploads |
| `SMTP_*` | ⚠️ | For emails |
| `FRONTEND_URL` | ✅ | Your frontend URL |
| `RAZORPAY_*` | ⚠️ | For payments (optional) |

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database connection works
- [ ] `/api/health` returns OK
- [ ] Registration works (`/api/auth/register`)
- [ ] Login works (`/api/auth/login`)
- [ ] Frontend can call API (CORS configured)
- [ ] Emails are sent (if SMTP configured)

---

## Troubleshooting

### Backend Won't Start
- Check Node.js logs in hPanel
- Verify `backend/package.json` exists
- Ensure startup file is `src/app.js`

### Database Connection Error
- Verify DATABASE_URL format
- Check database user permissions
- Ensure database exists

### CORS Errors
- Backend has CORS enabled for frontend URL
- Check `FRONTEND_URL` environment variable

### 500 Errors on API
- Check application logs
- Verify all environment variables
- Test health endpoint first

---

## Quick Summary

1. **Create subdomain:** `api.test.digiglowmarketing.in`
2. **Create Node.js app** pointing to `backend` folder
3. **Add MySQL database** and connection string
4. **Set all environment variables**
5. **Deploy from GitHub**
6. **Run migrations**
7. **Test API**
8. **Update frontend API URL**

---

**Need Help?** Check Hostinger Node.js logs or contact support.
