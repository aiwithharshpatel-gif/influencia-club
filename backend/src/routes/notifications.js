import express from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { getVapidPublicKey } from '../services/pushService.js';

const router = express.Router();

// Middleware to verify JWT token and attach user auth info
const verifyUser = (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.email || !decoded.role) {
      return res.status(400).json({ success: false, message: 'Invalid token payload.' });
    }
    req.userAuth = {
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Get VAPID Public Key
 * GET /api/notifications/vapid-key
 */
router.get('/vapid-key', verifyUser, (req, res) => {
  try {
    const publicKey = getVapidPublicKey();
    res.json({ success: true, publicKey });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Subscribe to Push Notifications
 * POST /api/notifications/subscribe
 * Body: { subscription: { endpoint, keys: { auth, p256dh } } }
 */
router.post('/subscribe', verifyUser, async (req, res) => {
  try {
    const { subscription } = req.body;
    const { email, role } = req.userAuth;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ success: false, message: 'Subscription details required' });
    }

    // Upsert the subscription: find unique by email & endpoint
    const existing = await prisma.pushSubscription.findFirst({
      where: {
        email,
        endpoint: subscription.endpoint
      }
    });

    if (existing) {
      // Update subscription keys if needed
      await prisma.pushSubscription.update({
        where: { id: existing.id },
        data: {
          role,
          keys: subscription.keys
        }
      });
    } else {
      // Create new subscription
      await prisma.pushSubscription.create({
        data: {
          email,
          role,
          endpoint: subscription.endpoint,
          keys: subscription.keys
        }
      });
    }

    res.json({ success: true, message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Unsubscribe from Push Notifications
 * POST /api/notifications/unsubscribe
 * Body: { endpoint }
 */
router.post('/unsubscribe', verifyUser, async (req, res) => {
  try {
    const { endpoint } = req.body;
    const { email } = req.userAuth;

    if (!endpoint) {
      return res.status(400).json({ success: false, message: 'Endpoint required' });
    }

    // Delete subscriptions matching email and endpoint
    await prisma.pushSubscription.deleteMany({
      where: {
        email,
        endpoint
      }
    });

    res.json({ success: true, message: 'Unsubscribed from push notifications successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
