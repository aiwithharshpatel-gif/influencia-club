import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
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
import { cleanupTestData } from './clean_test_data.js';

import { sanitizeRequest } from './middleware/sanitizer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validate required environment variables on startup
const requiredEnvVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_ADMIN_SECRET', 'DATABASE_URL'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`FATAL: ${envVar} environment variable is not set`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', true);
const PORT = process.env.PORT || 5000;

// Helper to extract the true client IP across Cloudflare, Caddy, and Nginx proxy chains
export const getClientIp = (req) => {
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim()).filter(Boolean);
    if (ips.length > 0) return ips[0];
  }
  return (
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
};

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Limit each IP to 10000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientIp,
  validate: { trustProxy: false },
  skip: (req) => {
    // Always permit health checks, Instagram endpoints, creators directory, notifications, password reset, and session validation
    const url = req.originalUrl || req.url || req.path || '';
    if (
      url.includes('/api/health') ||
      url.includes('/auth/instagram') ||
      url.includes('/oauth/instagram') ||
      url.includes('/auth/me') ||
      url.includes('/creators') ||
      url.includes('/notifications') ||
      url.includes('/forgot-password') ||
      url.includes('/reset-password')
    ) {
      return true;
    }
    if (process.env.NODE_ENV !== 'production' && url.includes('/api/auth/latest-otp')) {
      return true;
    }
    return false;
  }
});

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://influenziaclub.com',
  'https://www.influenziaclub.com',
  'https://test.influenziaclub.com',
  'http://localhost:5173',
  'http://localhost:3000'
].filter(Boolean);

// Middleware
app.use(globalLimiter);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.startsWith(o))) {
      return callback(null, true);
    }
    return callback(null, true);
  },
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
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.io authentication middleware (H5 fix)
io.use((socket, next) => {
  try {
    // Extract token from cookie header or auth handshake
    const cookieHeader = socket.handshake.headers.cookie || '';
    const accessTokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
    const adminTokenMatch = cookieHeader.match(/adminToken=([^;]+)/);
    const token = socket.handshake.auth?.token || accessTokenMatch?.[1] || adminTokenMatch?.[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    // Try verifying with JWT_SECRET first (creator/brand), then JWT_ADMIN_SECRET (admin)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    }

    if (!decoded || !decoded.id) {
      return next(new Error('Invalid token'));
    }

    // Attach authenticated identity to socket
    socket.userId = decoded.id;
    socket.userEmail = decoded.email;
    socket.userRole = decoded.role;
    next();
  } catch (error) {
    console.warn(`[SECURITY] Socket auth failed: ${error.message}`);
    next(new Error('Authentication failed'));
  }
});

// Socket connection registry (authenticated connections only)
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id} (user: ${socket.userId}, role: ${socket.userRole})`);

  // Client joins their own room only — prevents cross-user eavesdropping
  socket.on('join', (roomName) => {
    const allowedRooms = [socket.userId, socket.userEmail].filter(Boolean);
    if (!allowedRooms.includes(roomName)) {
      console.warn(`[SECURITY] Socket ${socket.id} tried to join unauthorized room: ${roomName}`);
      socket.emit('error', { message: 'Not authorized to join this room' });
      return;
    }
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
  
  // Clean up any test/demo profiles and inquiries
  cleanupTestData();

  // Start the Instagram Profile statistics daily auto-sync background task
  startInstagramSyncScheduler();
});

export default app;
