# Unified Deployment Guide - Frontend + Backend Together

## Deploy Both on Hostinger as Single Node.js App

---

## Architecture

```
test.digiglowmarketing.in/
├── Frontend (Static files from /dist)
└── /api/* (Backend Express routes)
```

---

## Step 1: Update GitHub (Already Done)

The repository now has:
- ✅ `unified-startup.cjs` - Serves both frontend and backend
- ✅ `package.json` - Builds both frontend and backend
- ✅ All dependencies included

---

## Step 2: Configure Hostinger Node.js App

### A. Update Existing App or Create New

1. Go to **hPanel → Node.js**
2. **Delete existing app** (if any)
3. **Create new application:**

| Setting | Value |
|---------|-------|
| **Node.js Version** | 18.x or 20.x |
| **Application Root** | (leave empty - root directory) |
| **Application URL** | `test.digiglowmarketing.in` |
| **Startup File** | `unified-startup.cjs` |
| **Application Mode** | `production` |
| **Build Command** | `npm install && npm run build` |

---

## Step 3: Create MySQL Database

1. **hPanel → Databases → MySQL Databases**
2. Create:
   - **Database Name:** `influenzia_db`
   - **Username:** `influenzia_user`
   - **Password:** (strong password)
3. **Save all credentials!**

---

## Step 4: Set Environment Variables

In Node.js app settings, add:

```bash
# Server
NODE_ENV=production
PORT=3000

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=influenzia_super_secure_jwt_2026_change_this_now_please
JWT_REFRESH_SECRET=influenzia_refresh_token_2026_change_this_too

# Database
DATABASE_URL=mysql://username:password@localhost:3306/database_name

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Brevo SMTP
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_login
SMTP_PASS=your_brevo_password
EMAIL_FROM=hello@influenziaclub.in

# App URLs
FRONTEND_URL=https://test.digiglowmarketing.in
REFERRAL_BASE_URL=https://test.digiglowmarketing.in/join?ref=

# Razorpay (Optional - for payments)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_secret

# Cashfree (Optional - for payouts)
CASHFREE_APP_ID=your_app_id
CASHFREE_SECRET_KEY=your_secret_key
```

---

## Step 5: Deploy from GitHub

1. In Node.js app → **Deploy from Git**
2. Repository: `aiwithharshpatel-gif/influencia-club`
3. Branch: `main`
4. Click **Deploy**

**Build Process:**
```bash
npm install              # Install all dependencies
npm run build            # Build frontend + backend
  → frontend builds to /dist
  → backend generates Prisma client
npm start                # Start unified-startup.cjs
```

---

## Step 6: Run Database Migrations

### Option A: SSH Access (Recommended)
```bash
cd /path/to/your/app
npx prisma migrate deploy
npx prisma generate
```

### Option B: Manual SQL Import
1. Open **phpMyAdmin** in hPanel
2. Select your database
3. Import tables using schema from `backend/prisma/schema.prisma`

---

## Step 7: Test Your Platform

### Frontend
Visit: **https://test.digiglowmarketing.in**

### Backend API
Visit: **https://test.digiglowmarketing.in/api/health**

Should return:
```json
{
  "status": "OK",
  "timestamp": "..."
}
```

### Test Registration
1. Go to homepage
2. Click "Join Now"
3. Fill registration form
4. Should create user in database

---

## Step 8: Update Vercel (Optional)

If you want to keep using Vercel for frontend:

1. Go to **Vercel Dashboard** → Frontend project
2. Settings → **Environment Variables**
3. Update:
   ```
   VITE_API_URL=https://test.digiglowmarketing.in/api
   ```
4. **Redeploy**

Or just use the unified deployment and remove from Vercel.

---

## File Structure After Deploy

```
/hosting_root/
├── unified-startup.cjs      # Main entry point
├── package.json             # All dependencies
├── dist/                    # Built frontend (auto-created)
│   ├── index.html
│   ├── assets/
│   └── ...
├── backend/
│   ├── src/
│   │   ├── app.js          # Express app
│   │   ├── routes/
│   │   └── ...
│   ├── prisma/
│   │   └── schema.prisma
│   └── node_modules/
├── frontend/
│   ├── src/
│   └── node_modules/
└── node_modules/            # Root dependencies
```

---

## Environment Variables Summary

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | ✅ | Set to `production` |
| `PORT` | ✅ | Server port (auto-set by Hostinger) |
| `JWT_SECRET` | ✅ | Token signing |
| `JWT_REFRESH_SECRET` | ✅ | Refresh tokens |
| `DATABASE_URL` | ✅ | MySQL connection |
| `CLOUDINARY_*` | ⚠️ | Image uploads |
| `SMTP_*` | ⚠️ | Email sending |
| `FRONTEND_URL` | ✅ | CORS & redirects |
| `RAZORPAY_*` | ⚠️ | Payments |

---

## Troubleshooting

### Build Fails
- Check Node.js logs in hPanel
- Verify all dependencies in package.json
- Ensure `npm run build` works locally

### App Won't Start
- Check startup file path: `unified-startup.cjs`
- Verify PORT environment variable
- Check logs for errors

### Database Connection Error
- Verify DATABASE_URL format
- Check database exists in Hostinger
- Ensure user has correct permissions

### API Returns 500
- Check backend logs
- Verify all environment variables
- Test health endpoint first: `/api/health`

### Frontend Shows But API Doesn't Work
- Ensure API routes use `/api` prefix
- Check CORS configuration in backend
- Verify FRONTEND_URL environment variable

---

## Advantages of Unified Deployment

✅ **Single deployment** - One app to manage
✅ **Same domain** - No CORS issues
✅ **Faster** - No cross-origin requests
✅ **Simpler** - One set of environment variables
✅ **Cheaper** - One hosting plan

---

## Quick Checklist

- [ ] MySQL database created
- [ ] Node.js app configured
- [ ] Startup file: `unified-startup.cjs`
- [ ] Build command: `npm install && npm run build`
- [ ] All environment variables set
- [ ] Deployed from GitHub
- [ ] Database migrations run
- [ ] Test `/api/health`
- [ ] Test frontend registration
- [ ] Verify emails work (if SMTP configured)

---

**Ready to deploy!** Follow the steps above to get both frontend and backend live on `test.digiglowmarketing.in` 🚀
