# INFLUENZIA CLUB

> Influence. Inspire. Ignite.

India's Next-Gen Influencer Platform - Connecting creators with brands.

## Tech Stack

### Frontend
- React 18 + Vite
- Tailwind CSS
- React Router v6
- React Hook Form
- Axios

### Backend
- Node.js + Express.js
- Prisma ORM
- MySQL Database
- JWT Authentication
- Cloudinary (file storage)
- Brevo (email)

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run both frontend and backend in development
npm run dev
```

## Project Structure

```
influenzia-club/
|-- frontend/          # React application
|-- backend/           # Express API server
`-- README.md
```

## Environment Setup

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
DATABASE_URL=mysql://user:pass@localhost:3306/influenzia
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your_brevo_login
SMTP_PASS=your_brevo_smtp_key
EMAIL_FROM=hello@influenziaclub.in
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## Features

- Creator registration with email verification
- Brand inquiry and matching
- Refer & Earn points system
- Creator dashboard
- Admin panel
- Cloudinary image upload
- JWT authentication

## License

Copyright 2026 ZCAD Nexoraa Pvt. Ltd.
