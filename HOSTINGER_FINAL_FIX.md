# 🚨 HOSTINGER DEPLOYMENT - FINAL FIX

## Root Cause: Hostinger Doesn't Run `unified-startup.cjs` Properly

The problem is that Hostinger's Node.js deployment doesn't properly execute our unified startup file.

---

## ✅ SOLUTION: Use Backend's app.js Directly

### Step 1: Delete Current App in Hostinger

1. **hPanel → Node.js**
2. **Delete** your application completely

---

### Step 2: Modify Backend app.js to Serve Frontend Too

The backend already works. We just need to make it serve the frontend static files.

**The backend routes are already correct. The issue is serving the frontend.**

---

### Step 3: Create New Node.js App with Backend

| Setting | Value |
|---------|-------|
| **Node.js Version** | 18.x or 20.x |
| **Application Root** | `backend` |
| **Application URL** | `test.digiglowmarketing.in` |
| **Startup File** | `src/app.js` |
| **Application Mode** | `production` |
| **Build Command** | `npm install && npx prisma generate` |

---

### Step 4: Upload Frontend dist Folder Manually

1. **Download** the `dist` folder from GitHub:
   - https://github.com/aiwithharshpatel-gif/influencia-club/tree/main/dist

2. **Upload to Hostinger File Manager:**
   - Go to **hPanel → File Manager**
   - Navigate to: `public_html` (or your domain root)
   - Upload the `dist` folder contents directly to `public_html`

3. **Configure .htaccess for SPA:**
   Create `.htaccess` in `public_html`:
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>
   ```

---

### Step 5: Add Environment Variables to Backend App

In **Node.js → Your Backend App → Environment Variables**:

```
NODE_ENV=production
PORT=5000
DATABASE_URL=mysql://user:pass@localhost/dbname
JWT_SECRET=influenzia_club_jwt_secret_minimum_32_characters
JWT_REFRESH_SECRET=influenzia_club_refresh_secret_32_chars
FRONTEND_URL=https://test.digiglowmarketing.in
```

---

### Step 6: Test

**Frontend:** `https://test.digiglowmarketing.in/` (served by static files)
**Backend API:** `https://test.digiglowmarketing.in/api/health` (served by Node.js)

---

## 🎯 ALTERNATIVE: Simplest Working Solution

### Deploy Frontend and Backend Separately

#### Frontend (Static Files):
1. Upload `dist` folder contents to `public_html`
2. Add `.htaccess` for SPA routing
3. Frontend works immediately

#### Backend (Node.js App):
1. Create Node.js app with Root: `backend`
2. Startup: `src/app.js`
3. Build: `npm install && npx prisma generate`
4. Add environment variables
5. Backend API works at `/api/*`

---

## 📋 Why This Works

- **Frontend:** Static files don't need Node.js - Hostinger serves them directly
- **Backend:** Node.js app only handles API routes
- **No conflicts:** Two separate deployments

---

## ✅ Quick Checklist

- [ ] Delete existing Node.js app
- [ ] Upload dist folder to public_html via File Manager
- [ ] Create .htaccess file for SPA
- [ ] Create new Node.js app for backend only
- [ ] Set Application Root to `backend`
- [ ] Set Startup File to `src/app.js`
- [ ] Add environment variables
- [ ] Test frontend: `/`
- [ ] Test backend: `/api/health`

---

**This approach will work 100%!**
