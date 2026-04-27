import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { generateOTP, generateReferralCode } from '../utils/helpers.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/otp_master.js';
import { creditPoints, processReferral } from '../services/pointsService.js';
import { validateCreator, safeErrorMessage } from '../middleware/errorHandler.js';

const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes'
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests, please try again after 15 minutes'
});

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Register - Send OTP
router.post('/register', otpLimiter, validateCreator, async (req, res) => {
  try {
    const { name, email, mobile, instagram, category, city, referralCode, password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    otpStore.set(email, { otp, expiry: otpExpiry, userData: req.body });

    // Send verification email
    await sendVerificationEmail(email, otp, name);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      email
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Verify OTP and Complete Registration
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check OTP
    const storedOTP = otpStore.get(email);
    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please register again.'
      });
    }

    if (storedOTP.expiry < new Date()) {
      otpStore.delete(email);
      return res.status(400).json({
        success: false,
        message: 'Verification code expired. Please register again.'
      });
    }

    if (!timingSafeEqual(Buffer.from(storedOTP.otp), Buffer.from(otp))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // OTP verified, create user
    const { name, mobile, instagram, category, city, password, referralCode: inputReferralCode } = storedOTP.userData;

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate unique referral code
    const referralCode = generateReferralCode(name);

    // Check if referral code is valid
    let referrer = null;
    if (inputReferralCode) {
      referrer = await prisma.creator.findUnique({
        where: { referralCode: inputReferralCode }
      });
    }

    // Create creator
    const creator = await prisma.creator.create({
      data: {
        name,
        email,
        passwordHash,
        mobile,
        instagram: instagram.toLowerCase().replace('@', ''),
        category,
        city,
        referralCode,
        referredBy: referrer?.id || null,
        isApproved: true // Auto-approve at launch
      },
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true
      }
    });

    // Credit signup bonus
    await creditPoints(creator.id, 10, 'signup', 'Signup bonus');

    // Process referral if exists
    if (referrer) {
      await processReferral(referrer.id, creator.id);
    }

    // Delete OTP from store
    otpStore.delete(email);

    // Send welcome email
    await sendWelcomeEmail(email, name, referralCode);

    res.json({
      success: true,
      message: 'Registration successful! Welcome to Influenzia Club',
      creator
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find creator
    const creator = await prisma.creator.findUnique({
      where: { email }
    });

    if (!creator) {
      console.warn(`[SECURITY] Failed login attempt for email: ${email} (User not found)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, creator.passwordHash);

    if (!isValidPassword) {
      console.warn(`[SECURITY] Failed login attempt for email: ${email} (Invalid password)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if approved
    if (!creator.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Your profile is pending approval'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { id: creator.id, email: creator.email, role: 'creator', version: creator.passwordVersion },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: creator.id, version: creator.passwordVersion },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookies with strict sameSite and path restriction
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/api'
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/api'
    });

    res.json({
      success: true,
      message: 'Login successful',
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        instagram: creator.instagram,
        category: creator.category,
        city: creator.city,
        pointsBalance: creator.pointsBalance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Refresh Token - issues new access token
// Note: Full refresh token rotation requires RefreshToken model in Prisma schema
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const creator = await prisma.creator.findUnique({
      where: { id: decoded.id }
    });

    if (!creator || creator.passwordVersion !== decoded.version) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const accessToken = jwt.sign(
      { id: creator.id, email: creator.email, role: 'creator', version: creator.passwordVersion },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/api'
    });

    res.json({
      success: true,
      message: 'Token refreshed'
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const creator = await prisma.creator.findUnique({
      where: { email }
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Email not found'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { id: creator.id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Send reset email
    await sendPasswordResetEmail(email, resetToken, creator.name);

    res.json({
      success: true,
      message: 'Password reset link sent to your email'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.creator.update({
      where: { id: decoded.id },
      data: { 
        passwordHash,
        passwordVersion: { increment: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
});

// Admin Login
router.post('/admin-login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email }
    });

    if (!admin) {
      console.warn(`[SECURITY] Failed ADMIN login attempt for email: ${email} (Admin not found)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

    if (!isValidPassword) {
      console.warn(`[SECURITY] Failed ADMIN login attempt for email: ${email} (Invalid password)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid admin credentials'
      });
    }

    const adminSecret = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;

    const adminToken = jwt.sign(
      { id: admin.id, email: admin.email, role: 'admin', version: admin.passwordVersion },
      adminSecret,
      { expiresIn: '8h' }
    );

    res.cookie('adminToken', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
      path: '/api'
    });

    res.json({
      success: true,
      message: 'Admin login successful',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Get Current User Info
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.accessToken || req.cookies.adminToken;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    let decoded;
    let user;

    // Try verifying as creator
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'creator') {
        user = await prisma.creator.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            name: true,
            email: true,
            instagram: true,
            category: true,
            city: true,
            pointsBalance: true,
            isApproved: true,
            passwordVersion: true
          }
        });
        
        if (user && user.passwordVersion === decoded.version) {
          return res.json({
            success: true,
            role: 'creator',
            user
          });
        }
      }
    } catch (e) {
      // Not a valid creator token, try admin
    }

    // Try verifying as admin
    try {
      const adminSecret = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;
      decoded = jwt.verify(token, adminSecret);
      if (decoded.role === 'admin') {
        user = await prisma.admin.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            passwordVersion: true
          }
        });
        
        if (user && user.passwordVersion === decoded.version) {
          return res.json({
            success: true,
            role: 'admin',
            user
          });
        }
      }
    } catch (e) {
      // Both failed
    }

    res.status(401).json({
      success: false,
      message: 'Invalid or expired session'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
