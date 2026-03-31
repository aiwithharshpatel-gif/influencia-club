import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateOTP, generateReferralCode } from '../utils/helpers.js';
import { sendVerificationEmail, sendWelcomeEmail } from '../services/emailService.js';
import { creditPoints, processReferral } from '../services/pointsService.js';
import { validateCreator } from '../middleware/errorHandler.js';

const router = express.Router();
const prisma = new PrismaClient();

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Register - Send OTP
router.post('/register', validateCreator, async (req, res) => {
  try {
    const { name, email, mobile, instagram, category, city, referralCode } = req.body;

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
      message: error.message || 'Registration failed'
    });
  }
});

// Verify OTP and Complete Registration
router.post('/verify-otp', async (req, res) => {
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

    if (storedOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code'
      });
    }

    // OTP verified, create user
    const { name, mobile, instagram, category, city, referralCode: inputReferralCode } = storedOTP.userData;

    // Hash password (using mobile as initial password)
    const passwordHash = await bcrypt.hash(mobile, 10);

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
      message: error.message || 'Verification failed'
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find creator
    const creator = await prisma.creator.findUnique({
      where: { email }
    });

    if (!creator) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, creator.passwordHash);

    if (!isValidPassword) {
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
      { id: creator.id, email: creator.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: creator.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
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
      message: error.message || 'Login failed'
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

// Refresh Token
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

    if (!creator) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const accessToken = jwt.sign(
      { id: creator.id, email: creator.email },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000
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

    // TODO: Send reset email with link
    // For now, just return success
    res.json({
      success: true,
      message: 'Password reset link sent to your email',
      resetToken // Remove in production, send via email
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
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
      data: { passwordHash }
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

export default router;
