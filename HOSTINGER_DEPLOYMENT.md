# Hostinger Node.js Deployment Guide - Influenzia Club Backend

## Prerequisites

- Hostinger hosting plan with Node.js support
- FTP/SFTP access or File Manager
- MySQL database created in Hostinger
- Domain/subdomain configured

---

## Quick Deploy (Automated via GitHub)

### 1. Connect GitHub Repository

1. In hPanel, go to **Node.js**
2. Create new application
3. Select **Deploy from Git** (if available)
4. Connect your GitHub repository: `aiwithharshpatel-gif/influencia-club`
5. Branch: `main`

### 2. Configure Node.js App

- **Node.js Version:** 18.x or 20.x
- **Application Root:** (leave empty for root deployment)
- **Startup File:** `startup.js`
- **Application Mode:** `production`
- **Build Command:** `npm install && npm run build`

### 3. Set Environment Variables

In Node.js configuration, add these:

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
