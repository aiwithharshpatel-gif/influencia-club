import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/auth.js';
import creatorRoutes from './routes/creators.js';
import inquiryRoutes from './routes/inquiries.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import paymentRoutes from './routes/payments.js';
import brandRoutes from './routes/brand.js';
import rewardsRoutes from './routes/rewards.js';
import milestonesRoutes from './routes/milestones.js';
import notificationsRoutes from './routes/notifications.js';
import { startInstagramSyncScheduler } from './services/instagramSyncScheduler.js';

import { sanitizeRequest } from './middleware/sanitizer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables on startup
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: ${envVar} environment variable is not set`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.headers['x-test-bypass'] === 'true') {
      return true;
    }
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return req.path.includes('/api/auth/latest-otp');
  }
});

// Middleware
app.use(globalLimiter);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(sanitizeRequest);

// Security headers
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'"],
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    upgradeInsecureRequests: [],
  }
}));
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
app.use(helmet.noSniff());
app.use(helmet.xssFilter());
app.use(helmet.frameguard({ action: 'deny' }));
app.disable('x-powered-by');

// Permissions Policy
app.use((req, res, next) => {
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), midi=(), sync-xhr=(), microphone=(), camera=(), magnetometer=(), gyroscope=(), fullscreen=(self), payment=()'
  );
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/rewards', rewardsRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/notifications', notificationsRoutes);


import { createServer } from 'http';
import { Server } from 'socket.io';

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Influenzia Club API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message
  });
});

// Create HTTP server and integrate socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket connection registry
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // Client joins their specific room (either user email or creator ID)
  socket.on('join', (roomName) => {
    socket.join(roomName);
    console.log(`Socket client ${socket.id} joined room: ${roomName}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Expose io instance to Express routes
app.set('io', io);

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Influenzia Club API with WebSockets running on port ${PORT} at 0.0.0.0`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Start the Instagram Profile statistics daily auto-sync background task
  startInstagramSyncScheduler();
});

export default app;
