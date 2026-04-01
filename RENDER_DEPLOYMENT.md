# Influenzia Club - Render Deployment Guide

## Deploy Backend on Render (Free Tier)

---

## Step 1: Sign In to Render

1. Go to: **https://render.com**
2. Click **"Get Started for Free"**
3. Click **"Sign in with GitHub"**
4. Authorize Render to access your GitHub (`aiwithharshpatel-gif`)

---

## Step 2: Create New Web Service

1. Click **"New +"** (top right)
2. Select **"Web Service"**
3. Under "Connect a repository", find and click **"Connect"** next to `influencia-club`

---

## Step 3: Configure the Service

Fill in these settings:

| Field | Value |
|-------|-------|
| **Name** | `influenzia-club-backend` |
| **Region** | Choose closest to India (Singapore/Tokyo) |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `node src/app.js` |
| **Instance Type** | `Free` |

---

## Step 4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"** for each:

```
NODE_ENV=production
JWT_SECRET=influenzia_super_secret_jwt_key_2026_change_this
JWT_REFRESH_SECRET=influenzia_refresh_secret_2026_change_this
EMAIL_FROM=hello@influenziaclub.in
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_username_here
SMTP_PASS=your_brevo_password_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_name_here
CLOUDINARY_API_KEY=your_cloudinary_key_here
CLOUDINARY_API_SECRET=your_cloudinary_secret_here
```

> **Note:** For free tier, we'll use SQLite for now. For production, add MySQL later.

---

## Step 5: Add Database (Render PostgreSQL)

1. Click **"New +"** → **"PostgreSQL"**
2. Name: `influenzia-db`
3. Region: Same as your web service
4. Click **"Create Database"**
5. Once created, copy the **Internal Database URL**

---

## Step 6: Update Prisma for PostgreSQL

In your Render web service, add this environment variable:

```
DATABASE_URL=<paste the PostgreSQL URL from Step 5>
```

**Note:** You'll need to change Prisma provider from MySQL to PostgreSQL in `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Step 7: Deploy!

1. Click **"Create Web Service"**
2. Render will start building (takes 2-5 minutes)
3. Watch logs in **"Logs"** tab
4. Once deployed, you'll get a URL like:
   `https://influenzia-club-backend.onrender.com`

---

## Step 8: Run Database Migrations

After first deploy, open **Render Shell**:

1. Go to your service → **"Shell"** tab
2. Click **"Connect"**
3. Run: `npx prisma migrate deploy`
4. Run: `npx prisma generate`

---

## Step 9: Test Your API

Visit: `https://your-app.onrender.com/api/health`

Should return: `{"status": "OK"}`

---

## Environment Variables Summary

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | (random 32+ chars) |
| `JWT_REFRESH_SECRET` | (random 32+ chars) |
| `DATABASE_URL` | (from Render PostgreSQL) |
| `SMTP_HOST` | `smtp-relay.brevo.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | (from Brevo) |
| `SMTP_PASS` | (from Brevo) |
| `CLOUDINARY_CLOUD_NAME` | (from Cloudinary) |
| `CLOUDINARY_API_KEY` | (from Cloudinary) |
| `CLOUDINARY_API_SECRET` | (from Cloudinary) |
| `EMAIL_FROM` | `hello@influenziaclub.in` |
| `FRONTEND_URL` | (your Vercel URL later) |

---

## Free Tier Limits

- **Web Service:** 750 hours/month (shared across all services)
- **PostgreSQL:** 1GB storage, free for 90 days
- **Auto-sleep:** Service sleeps after 15 min inactivity (wakes on request)

---

## After Deployment

1. Copy your Render URL
2. Update frontend `.env` with: `VITE_API_URL=https://your-app.onrender.com/api`
3. Deploy frontend to Vercel
4. Update `FRONTEND_URL` in Render with your Vercel URL

---

## Troubleshooting

### Build Fails
- Check logs for errors
- Ensure `backend/package.json` exists
- Verify build command: `npm install && npx prisma generate`

### Database Connection Error
- Check `DATABASE_URL` is correct
- Ensure PostgreSQL is in same region
- Run migrations in shell

### Service Sleeps
- Free tier auto-sleeps after 15 min
- First request after sleep takes 30-60 sec to wake
- Upgrade to paid plan to disable sleep

---

**Need Help?** Check Render logs or ask for assistance!
