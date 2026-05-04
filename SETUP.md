# INFLUENZIA CLUB - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v20 or higher) - [Download](https://nodejs.org/)
- **MySQL** (v8.0 or higher) - [Download](https://dev.mysql.com/downloads/)
- **Git** (optional) - [Download](https://git-scm.com/)

---

## Quick Start

### 1. Clone/Extract the Project

Navigate to the project directory:
```bash
cd "D:\Projects\Influenzia Club\Building with Qwen CLI"
```

### 2. Install Dependencies

Install all dependencies for both frontend and backend:
```bash
npm run install:all
```

Or install manually:
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Set Up MySQL Database

1. Open MySQL and create a new database:
```sql
CREATE DATABASE influenzia;
```

2. Update the `DATABASE_URL` in `backend/.env`:
```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/influenzia
```

### 4. Configure Environment Variables

#### Backend (.env)
Copy the example environment file:
```bash
cd backend
copy .env.example .env
```

Edit `backend/.env` with your credentials:
```env
# Server
PORT=5000
NODE_ENV=development
JWT_SECRET=influenzia_club_jwt_secret_key_change_in_production_2026
JWT_REFRESH_SECRET=influenzia_club_refresh_secret_key_change_in_production_2026

# Database
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/influenzia

# Cloudinary (Get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Brevo SMTP (Get from https://brevo.com)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_login
SMTP_PASS=your_brevo_smtp_key
EMAIL_FROM=hello@influenziaclub.com

# App
FRONTEND_URL=http://localhost:5173
REFERRAL_BASE_URL=http://localhost:5173/join?ref=
```

#### Frontend (.env)
Copy the example environment file:
```bash
cd frontend
copy .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 5. Set Up Database Schema

Run Prisma migrations to create database tables:
```bash
cd backend
npx prisma migrate dev --name init
```

This will:
- Create all database tables
- Set up relationships and indexes
- Generate the Prisma Client

### 6. (Optional) Generate Prisma Client

```bash
npx prisma generate
```

### 7. Create Admin User (Optional)

You can create an admin user directly in MySQL:
```sql
USE influenzia;

INSERT INTO admins (id, name, email, password_hash, role) 
VALUES (
  UUID(),
  'Admin',
  'admin@influenziaclub.com',
  '$2a$10$YourHashedPasswordHere',
  'super_admin'
);
```

**Note:** You'll need to hash the password using bcrypt. Use this Node.js snippet:
```javascript
const bcrypt = require('bcryptjs');
console.log(bcrypt.hashSync('your_password', 10));
```

---

## Running the Application

### Option 1: Run Both (Frontend + Backend)

From the root directory:
```bash
npm run dev
```

This will start:
- Backend API on `http://localhost:5000`
- Frontend on `http://localhost:5173`

### Option 2: Run Separately

#### Backend Only
```bash
cd backend
npm run dev
```

#### Frontend Only
```bash
cd frontend
npm run dev
```

---

## Testing the Application

1. **Open your browser** and go to `http://localhost:5173`

2. **Test Registration:**
   - Navigate to `/join`
   - Fill in the registration form
   - Check your email for OTP (if SMTP is configured)
   - Verify and complete registration

3. **Test Login:**
   - Navigate to `/login`
   - Use your registered email and password (mobile number)
   - You'll be redirected to the dashboard

4. **Test Dashboard:**
   - View your profile
   - Check referral link
   - Explore points system

5. **Test Brand Inquiry:**
   - Navigate to `/brands`
   - Submit a brand inquiry form

---

## Default Test Accounts

After registration, you can test with your own accounts.

**Password:** Your mobile number (10 digits)

---

## Troubleshooting

### Database Connection Error
- Ensure MySQL is running
- Check `DATABASE_URL` in `backend/.env`
- Verify database `influenzia` exists

### Port Already in Use
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port in `frontend/vite.config.js`

### Email Not Sending
- Verify Brevo SMTP credentials
- Check if `EMAIL_FROM` is configured
- For development, emails are logged to console if SMTP is not configured

### Prisma Errors
```bash
cd backend
npx prisma generate
npx prisma migrate dev
```

---

## Project Structure

```
influenzia-club/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Auth & error handlers
│   │   ├── services/           # Email, points logic
│   │   ├── utils/              # Helper functions
│   │   └── app.js              # Express app
│   ├── .env                    # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Page components
│   │   ├── context/            # React context (Auth)
│   │   ├── utils/              # API utilities
│   │   ├── App.jsx             # Main app component
│   │   └── main.jsx            # Entry point
│   ├── .env                    # Environment variables
│   └── package.json
│
├── package.json                # Root package.json
└── README.md
```

---

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/creators` - List all creators
- `GET /api/creators/:id` - Get single creator
- `POST /api/auth/register` - Register creator
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/login` - Login
- `POST /api/inquiries` - Submit brand inquiry
- `POST /api/contact` - Submit contact form

### Protected Endpoints (Require Auth)
- `GET /api/me` - Get own profile
- `PUT /api/me` - Update profile
- `GET /api/dashboard/overview` - Dashboard overview
- `GET /api/dashboard/points` - Points history
- `GET /api/dashboard/referrals` - Referral stats
- `POST /api/dashboard/redeem` - Redeem points

### Admin Endpoints
- `GET /api/admin/stats` - Dashboard stats
- `GET /api/admin/creators` - All creators
- `PUT /api/admin/creators/:id` - Update creator
- `GET /api/admin/inquiries` - Brand inquiries
- `GET /api/admin/redemptions` - Redemption requests

---

## Next Steps

1. **Customize Branding:**
   - Update colors in `frontend/tailwind.config.js`
   - Add logo in `frontend/public/`

2. **Configure Email:**
   - Set up Brevo account at https://brevo.com
   - Update SMTP credentials in `backend/.env`

3. **Configure Cloudinary:**
   - Set up Cloudinary account at https://cloudinary.com
   - Update credentials in `backend/.env`

4. **Deploy to Production:**
   - See `DEPLOYMENT.md` for deployment instructions

---

## Support

For issues or questions:
- Check the blueprint documentation
- Review Prisma schema in `backend/prisma/schema.prisma`
- Check API routes in `backend/src/routes/`

---

**Built with ❤️ for Influenzia Club**
Powered by ZCAD Nexoraa Pvt. Ltd.
