import 'dotenv/config';
import crypto from 'crypto';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

// Import routes
import authRoutes from './routes/auth.js';
import creatorRoutes from './routes/creators.js';
import inquiryRoutes from './routes/inquiries.js';
import dashboardRoutes from './routes/dashboard.js';
import adminRoutes from './routes/admin.js';
import contactRoutes from './routes/contact.js';
import paymentRoutes from './routes/payments.js';
import { sanitizeRequest } from './middleware/sanitizer.js';
import { verifyEmailTransport } from './services/otp_master.js';
import prisma from './lib/prisma.js';

import { env } from './config/env.js';

const app = express();
app.set('trust proxy', 1);
const PORT = env.port;

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(globalLimiter);
app.use(cors({
  origin(origin, callback) {
    if (!origin || env.frontendOrigins.includes(origin.replace(/\/$/, ''))) {
      return callback(null, true);
    }
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());
app.use(sanitizeRequest);
app.use((req, res, next) => {
  const requestId = req.get('x-request-id') || crypto.randomUUID();
  const startedAt = Date.now();
  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);
  res.on('finish', () => {
    console.log(JSON.stringify({
      level: 'info',
      message: 'request_completed',
      requestId,
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      durationMs: Date.now() - startedAt
    }));
  });
  next();
});

// Security headers
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
    upgradeInsecureRequests: env.isProduction ? [] : null,
  }
}));
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: env.isProduction
    ? { maxAge: 31536000, includeSubDomains: true, preload: true }
    : false
}));
app.use(helmet.referrerPolicy({ policy: 'strict-origin-when-cross-origin' }));
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: env.nodeEnv });
});

app.get('/api/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ready' });
  } catch (error) {
    console.error('Readiness check failed:', error.message);
    res.status(503).json({ status: 'unavailable' });
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', { requestId: req.requestId, error: err });
  const isProduction = env.isProduction;
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'Internal server error' : err.message
  });
});

// Start server
await verifyEmailTransport();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Influenzia Club API running on port ${PORT} at 0.0.0.0`);
  console.log(`Environment: ${env.nodeEnv}`);
});

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
