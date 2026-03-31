# INFLUENZIA CLUB - Quick Deploy Guide

## Fastest Way to Production (Under 30 Minutes)

---

## 🚀 **Express Deployment** (Railway + Vercel)

**This is the FASTEST path to production.**

### **Prerequisites (5 min)**
```
□ GitHub account created
□ Railway account created (https://railway.app)
□ Vercel account created (https://vercel.com)
□ Domain purchased (optional, can use free subdomains)
```

---

## **STEP-BY-STEP (25 minutes)**

### **Minute 0-5: Push to GitHub**

```bash
# In your project folder
git init
git add .
git commit -m "Deploy to production"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/influenzia-club.git
git push -u origin main
```

---

### **Minute 5-10: Deploy Backend to Railway**

1. **Go to railway.app**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose "influenzia-club"**
5. **Set Root Directory: `backend`**
6. **Add these variables:**

```env
NODE_ENV=production
JWT_SECRET=change_this_to_something_random_32_chars
JWT_REFRESH_SECRET=another_random_32_char_string
DATABASE_URL=mysql://user:pass@host.railway.internal:3306/railway
FRONTEND_URL=https://your-app.up.railway.app
REFERRAL_BASE_URL=https://your-app.up.railway.app/join?ref=
```

**That's it for now!** Railway auto-provisions MySQL.

7. **Click Deploy**
8. **Wait 3 minutes**
9. **Copy your Railway URL** (e.g., `https://your-app.up.railway.app`)

---

### **Minute 10-15: Deploy Frontend to Vercel**

1. **Go to vercel.com**
2. **Click "Add New Project"**
3. **Import GitHub repo "influenzia-club"**
4. **Configure:**
   ```
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   ```
5. **Add Environment Variable:**
   ```
   VITE_API_URL=https://your-app.up.railway.app/api
   ```
6. **Click Deploy**
7. **Wait 2 minutes**
8. **Copy your Vercel URL** (e.g., `https://influenzia-club.vercel.app`)

---

### **Minute 15-20: Update Backend URLs**

**Go back to Railway:**

1. **Update these variables:**
   ```env
   FRONTEND_URL=https://influenzia-club.vercel.app
   REFERRAL_BASE_URL=https://influenzia-club.vercel.app/join?ref=
   ```

2. **Redeploy** (click "Deploy" again)

---

### **Minute 20-25: Test Deployment**

1. **Visit your Vercel URL**
   ```
   https://influenzia-club.vercel.app
   ```

2. **Test Registration:**
   - Go to /join
   - Fill form
   - Check email for OTP
   - Verify and login

3. **Test API:**
   ```
   https://your-app.up.railway.app/api/health
   ```

4. **If everything works → DEPLOYMENT SUCCESS! ✅**

---

## 🎯 **Next Steps (After Express Deploy)**

### **Today:**
```
□ Create admin user in database
□ Add Cloudinary credentials (for photo uploads)
□ Add Brevo credentials (for emails)
□ Test full registration flow
□ Create 5 demo creator profiles
```

### **Tomorrow:**
```
□ Add custom domain (if purchased)
□ Switch Razorpay to live mode
□ Setup UptimeRobot monitoring
□ Start creator outreach
```

---

## 📝 **Add Cloudinary & Brevo (Optional for Now)**

### Cloudinary (5 min):
```
1. Go to cloudinary.com
2. Sign up (free)
3. Get credentials from dashboard
4. Add to Railway variables:
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
```

### Brevo (5 min):
```
1. Go to brevo.com
2. Sign up (free 300 emails/day)
3. Get SMTP credentials
4. Add to Railway variables:
   - SMTP_USER
   - SMTP_PASS
   - EMAIL_FROM=hello@influenziaclub.in
```

---

## 🆘 **Quick Troubleshooting**

### Frontend shows "Network Error"
```
→ Check VITE_API_URL in Vercel settings
→ Should be: https://your-railway-app.up.railway.app/api
→ Redeploy frontend after changing
```

### Registration doesn't send OTP email
```
→ This is OK for testing (emails won't send without Brevo)
→ User still gets created in database
→ Add Brevo credentials to enable emails
```

### Database errors
```
→ Railway auto-provisions MySQL
→ Wait 2-3 minutes after first deploy
→ Check Railway logs for errors
```

---

## ✅ **Minimum Viable Deployment**

**You can launch with JUST this:**

```
✅ Railway backend (with auto MySQL)
✅ Vercel frontend
✅ No custom domain (use .vercel.app and .railway.app)
✅ No email service (manually verify users for now)
✅ No Cloudinary (use placeholder images)
✅ No payments (manual deals initially)
```

**Add everything else LATER based on user feedback!**

---

## 🎯 **The 80/20 Rule of Deployment**

**80% of value comes from:**
- ✅ Working registration
- ✅ Creator profiles
- ✅ Brand inquiry form
- ✅ Dashboard access

**20% of value comes from:**
- Custom domains
- Email automation
- Payment integration
- Advanced features

**Focus on the 80% first!**

---

## 📊 **Deployment Checklist (Quick)**

```
□ Code pushed to GitHub
□ Backend deployed to Railway
□ Frontend deployed to Vercel
□ Environment variables set
□ API health check passes
□ Registration flow works
□ Login works
□ Dashboard accessible
□ (Optional) Custom domain configured
□ (Optional) Email service configured
```

---

## 🎉 **You're Live!**

**Once deployed:**

1. **Share the link** with friends
2. **Onboard 5 creators** manually
3. **Onboard 2 brands** manually
4. **Get feedback**
5. **Iterate**

**Don't wait for perfection!**

---

## 📞 **Need Help?**

**Common questions:**

**Q: How do I check if backend is running?**
```
Visit: https://your-app.up.railway.app/api/health
Should return: {"status": "ok", "message": "..."}
```

**Q: How do I view logs?**
```
Railway Dashboard → Your Service → Deployments → View Logs
```

**Q: How do I add more environment variables?**
```
Railway Dashboard → Variables → Add Variable
Then redeploy
```

**Q: Can I use my own domain for free?**
```
Yes! Vercel and Railway both offer free subdomains.
Custom domain is optional.
```

---

**Ready to deploy? Let's go! 🚀**

*Quick Deploy Guide - March 2026*
