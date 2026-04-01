# Hostinger Node.js Deployment Guide - Influenzia Club Backend

## Prerequisites

- Hostinger hosting plan with Node.js support
- FTP/SFTP access or File Manager
- MySQL database created in Hostinger
- Domain/subdomain configured

---

## Step 1: Prepare Backend for Production

### 1.1 Create Production Build

```bash
cd backend
npm install --production
npx prisma generate
```

### 1.2 Create `.env.production`

Create this file in the `backend` folder:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secret_jwt_key_change_this_now
JWT_REFRESH_SECRET=another_random_secret_change_this
DATABASE_URL=mysql://username:password@localhost:3306/database_name
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_username
SMTP_PASS=your_brevo_password
EMAIL_FROM=hello@influenziaclub.in
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Step 2: Create MySQL Database on Hostinger

1. Login to **hPanel** (Hostinger control panel)
2. Go to **Databases** → **MySQL Databases**
3. Create new database:
   - **Database Name:** `influenzia_club` (or similar)
   - **Username:** Create new user
   - **Password:** Generate strong password
4. **Save these credentials** for DATABASE_URL

---

## Step 3: Upload Files to Hostinger

### Option A: Using File Manager (Easier)

1. Login to hPanel
2. Go to **Files** → **File Manager**
3. Navigate to your domain folder (e.g., `public_html` or domain root)
4. Create a folder named `backend`
5. Upload ALL backend files:
   - `package.json`
   - `package-lock.json`
   - `prisma/` folder
   - `src/` folder
   - `.env.production`

### Option B: Using FTP

1. Connect via FTP (FileZilla, etc.)
2. Host: Your domain or FTP hostname
3. Upload entire `backend` folder to your hosting directory

---

## Step 4: Setup Node.js App in hPanel

1. Go to **Advanced** → **Node.js**
2. Click **Create Application**
3. Configure:
   - **Node.js Version:** 18.x or 20.x
   - **Application Root:** `backend` (or wherever you uploaded)
   - **Application URL:** Your domain/subdomain
   - **Startup File:** `src/app.js`
   - **Application Mode:** `production`

4. Click **Create**

---

## Step 5: Set Environment Variables

In Node.js configuration:

1. Go to **Node.js** → Your application
2. Find **Environment Variables** section
3. Add each variable from `.env.production`:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `PORT` | `3000` |
| `JWT_SECRET` | (random 32+ chars) |
| `JWT_REFRESH_SECRET` | (random 32+ chars) |
| `DATABASE_URL` | `mysql://user:pass@localhost/dbname` |
| `CLOUDINARY_CLOUD_NAME` | (from Cloudinary) |
| `CLOUDINARY_API_KEY` | (from Cloudinary) |
| `CLOUDINARY_API_SECRET` | (from Cloudinary) |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (from Brevo) |
| `SMTP_PASS` | (from Brevo) |
| `EMAIL_FROM` | `hello@influenziaclub.in` |
| `FRONTEND_URL` | (your Vercel URL) |

---

## Step 6: Install Dependencies via SSH/Terminal

If Hostinger provides SSH access:

```bash
cd ~/public_html/backend
npm install --production
npx prisma generate
```

**If no SSH:** The Node.js app manager should auto-install on first run.

---

## Step 7: Run Database Migrations

### Option A: Via SSH (Recommended)

```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

### Option B: Manual SQL Import

1. Export schema locally:
```bash
cd backend
npx prisma db pull
```

2. Or create tables manually in **phpMyAdmin** using the schema from `backend/prisma/schema.prisma`

---

## Step 8: Start the Application

1. Go to **Node.js** in hPanel
2. Find your application
3. Click **Start** (if not auto-started)
4. Check **Logs** for any errors

---

## Step 9: Test Your API

Visit: `https://yourdomain.com/api/health`

Should return: `{"status": "OK"}`

Or test registration: `https://yourdomain.com/api/creators`

---

## Step 10: Update Frontend API URL

1. Go to **Vercel Dashboard** → Your frontend project
2. Settings → **Environment Variables**
3. Add/Edit: `VITE_API_URL`
4. Value: `https://yourdomain.com/api`
5. **Redeploy** the frontend

---

## Troubleshooting

### App Won't Start
- Check **Node.js Logs** in hPanel
- Verify `package.json` exists in backend folder
- Ensure startup file is `src/app.js`

### Database Connection Error
- Verify DATABASE_URL format: `mysql://user:pass@localhost:3306/dbname`
- Check database user has correct permissions
- Ensure database exists in Hostinger

### 500 Errors
- Check application logs
- Verify all environment variables are set
- Test with health endpoint first

### Static Files Not Loading
- Ensure `dist` folder is built (if using frontend build)
- Check file permissions (should be 644 for files, 755 for folders)

---

## Important Notes

1. **Port:** Hostinger usually assigns the port automatically. Use `process.env.PORT` in code.
2. **Database Host:** Usually `localhost` or MySQL server hostname from Hostinger
3. **SSL:** Enable SSL in Hostinger for HTTPS
4. **CORS:** Backend already has CORS configured for your frontend URL

---

## Quick Checklist

- [ ] Database created on Hostinger
- [ ] Backend files uploaded
- [ ] Node.js app created in hPanel
- [ ] Environment variables set
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] App started
- [ ] API tested
- [ ] Frontend API URL updated
- [ ] Frontend redeployed

---

**Need Help?** Check Hostinger's Node.js documentation or contact their support.
