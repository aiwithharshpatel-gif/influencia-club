import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { generateOTP, generateReferralCode } from '../utils/helpers.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail } from '../services/otp_master.js';
import { safeErrorMessage } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';
import {
  createSessionToken,
  hashOtp,
  hashSessionToken,
  normalizeEmail,
  normalizeInstagram,
  safeEqual
} from '../utils/security.js';

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

const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/\d/, 'Password must include a number');

const accessCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000,
  path: '/api'
};

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api'
};

const cookieClearOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict',
  path: '/api'
};

const clearCreatorSession = (res) => {
  res.clearCookie('accessToken', cookieClearOptions);
  res.clearCookie('refreshToken', cookieClearOptions);
};

const createStoredRefreshToken = async (creatorId, client = prisma) => {
  const token = createSessionToken();
  await client.refreshToken.create({
    data: {
      creatorId,
      tokenHash: hashSessionToken(token, env.otpSecret),
      expiresAt: new Date(Date.now() + refreshCookieOptions.maxAge)
    }
  });
  return token;
};

const setCreatorSession = (res, creator, refreshToken) => {
  const accessToken = jwt.sign(
    {
      id: creator.id,
      email: creator.email,
      role: 'creator',
      version: creator.passwordVersion
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.cookie('accessToken', accessToken, accessCookieOptions);
  res.cookie('refreshToken', refreshToken, refreshCookieOptions);
};

const registrationSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(150),
  mobile: z.string().regex(/^[6-9]\d{9}$/),
  instagram: z.string().min(1).max(100).regex(/^@?[A-Za-z0-9._]+$/),
  category: z.enum(['influencer', 'actor', 'model', 'creator', 'public_figure']),
  city: z.string().min(2).max(50),
  referralCode: z.string().max(20).optional().or(z.literal('')),
  password: passwordSchema
});

const createUniqueReferralCode = async (name) => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const referralCode = generateReferralCode(name);
    const exists = await prisma.creator.findUnique({ where: { referralCode } });
    if (!exists) return referralCode;
  }
  throw new Error('Unable to generate a referral code');
};

// Register - Send OTP
router.post('/register', otpLimiter, async (req, res) => {
  try {
    const parsed = registrationSchema.parse(req.body);
    const email = normalizeEmail(parsed.email);
    const instagram = normalizeInstagram(parsed.instagram);

    const existingCreator = await prisma.creator.findFirst({
      where: { OR: [{ email }, { instagram }] },
      select: { email: true, instagram: true }
    });

    if (existingCreator) {
      return res.status(409).json({
        success: false,
        message:
          existingCreator.email === email
            ? 'Email already registered'
            : 'Instagram handle already registered'
      });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const passwordHash = await bcrypt.hash(parsed.password, 12);

    await prisma.$transaction(async (tx) => {
      await tx.otpVerification.deleteMany({
        where: { expiresAt: { lt: new Date() } }
      });
      await tx.otpVerification.deleteMany({ where: { email } });
      await tx.otpVerification.create({
        data: {
          email,
          otp: hashOtp(email, otp, env.otpSecret),
          userData: {
            name: parsed.name,
            mobile: parsed.mobile,
            instagram,
            category: parsed.category,
            city: parsed.city,
            referralCode: parsed.referralCode || null,
            passwordHash
          },
          expiresAt: otpExpiry
        }
      });
    });

    await sendVerificationEmail(email, otp, parsed.name);

    res.json({
      success: true,
      message: 'Verification code sent to your email',
      email
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues
      });
    }
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Verify OTP and Complete Registration
router.post('/verify-otp', otpLimiter, async (req, res) => {
  try {
    const verification = z
      .object({
        email: z.string().email(),
        otp: z.string().regex(/^\d{6}$/)
      })
      .parse(req.body);
    const email = normalizeEmail(verification.email);

    const storedOTP = await prisma.otpVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });

    const submittedOtpHash = hashOtp(email, verification.otp, env.otpSecret);
    if (!storedOTP || !safeEqual(storedOTP.otp, submittedOtpHash)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code or no code found.'
      });
    }

    if (storedOTP.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { id: storedOTP.id } });
      return res.status(400).json({
        success: false,
        message: 'Verification code expired. Please register again.'
      });
    }

    const {
      name,
      mobile,
      instagram,
      category,
      city,
      passwordHash,
      referralCode: inputReferralCode
    } = storedOTP.userData;
    const referralCode = await createUniqueReferralCode(name);

    let referrer = null;
    if (inputReferralCode) {
      referrer = await prisma.creator.findUnique({
        where: { referralCode: inputReferralCode }
      });
    }

    const creator = await prisma.$transaction(async (tx) => {
      const created = await tx.creator.create({
        data: {
          name,
          email,
          passwordHash,
          mobile,
          instagram,
          category,
          city,
          referralCode,
          referredBy: referrer?.id || null,
          isApproved: false,
          pointsBalance: 10
        },
        select: {
          id: true,
          name: true,
          email: true,
          referralCode: true,
          passwordVersion: true
        }
      });

      await tx.pointsTransaction.create({
        data: {
          creatorId: created.id,
          type: 'earn',
          reason: 'signup',
          points: 10,
          note: 'Signup bonus'
        }
      });

      if (referrer) {
        await tx.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: created.id,
            status: 'confirmed',
            pointsCredited: true
          }
        });

        const referralCount = await tx.referral.count({
          where: { referrerId: referrer.id, status: 'confirmed' }
        });
        const milestonePoints = referralCount % 5 === 0 ? 100 : 0;

        await tx.creator.update({
          where: { id: referrer.id },
          data: { pointsBalance: { increment: 50 + milestonePoints } }
        });
        await tx.pointsTransaction.create({
          data: {
            creatorId: referrer.id,
            type: 'earn',
            reason: 'referral',
            points: 50,
            note: 'Referred a new creator'
          }
        });

        if (milestonePoints) {
          await tx.pointsTransaction.create({
            data: {
              creatorId: referrer.id,
              type: 'earn',
              reason: 'referral_milestone',
              points: milestonePoints,
              note: `${referralCount} referrals milestone`
            }
          });
        }
      }

      await tx.otpVerification.deleteMany({ where: { email } });
      return created;
    });

    sendWelcomeEmail(email, name, referralCode).catch((error) => {
      console.error(`Welcome email failed for ${email}: ${error.message}`);
    });

    const refreshToken = await createStoredRefreshToken(creator.id);
    setCreatorSession(res, creator, refreshToken);

    res.json({
      success: true,
      message: 'Registration successful! Welcome to Influenzia Club',
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        referralCode: creator.referralCode,
        pointsBalance: 10
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification request'
      });
    }
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const credentials = z
      .object({ email: z.string().email(), password: z.string().min(1).max(128) })
      .parse(req.body);
    const email = normalizeEmail(credentials.email);

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

    if (creator.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account is not active'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(credentials.password, creator.passwordHash);

    if (!isValidPassword) {
      console.warn(`[SECURITY] Failed login attempt for email: ${email} (Invalid password)`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    await prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { creatorId: creator.id, expiresAt: { lt: new Date() } },
          { creatorId: creator.id, createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } }
        ]
      }
    });
    const refreshToken = await createStoredRefreshToken(creator.id);
    setCreatorSession(res, creator, refreshToken);

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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Valid email and password are required'
      });
    }
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    if (req.cookies.refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: {
          tokenHash: hashSessionToken(req.cookies.refreshToken, env.otpSecret)
        }
      });
    }
  } catch (error) {
    console.error('Refresh token revocation failed during logout:', error.message);
  }

  clearCreatorSession(res);
  res.clearCookie('adminToken', cookieClearOptions);
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

router.post('/refresh', async (req, res) => {
  try {
    const submittedToken = req.cookies.refreshToken;

    if (!submittedToken) {
      return res.status(401).json({
        success: false,
        message: 'No refresh token'
      });
    }

    const storedToken = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashSessionToken(submittedToken, env.otpSecret)
      },
      include: { creator: true }
    });

    if (
      !storedToken ||
      storedToken.expiresAt <= new Date() ||
      storedToken.creator.status !== 'active'
    ) {
      clearCreatorSession(res);
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    const replacementToken = createSessionToken();
    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { id: storedToken.id } }),
      prisma.refreshToken.create({
        data: {
          creatorId: storedToken.creatorId,
          tokenHash: hashSessionToken(replacementToken, env.otpSecret),
          expiresAt: new Date(Date.now() + refreshCookieOptions.maxAge)
        }
      })
    ]);

    setCreatorSession(res, storedToken.creator, replacementToken);

    res.json({
      success: true,
      message: 'Token refreshed'
    });
  } catch (error) {
    clearCreatorSession(res);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
});

// Forgot Password
router.post('/forgot-password', otpLimiter, async (req, res) => {
  try {
    const { email: submittedEmail } = z.object({ email: z.string().email() }).parse(req.body);
    const email = normalizeEmail(submittedEmail);

    const creator = await prisma.creator.findUnique({
      where: { email }
    });

    if (!creator) {
      return res.json({
        success: true,
        message: 'If an account exists, a password reset link has been sent'
      });
    }

    // Generate reset token
    const resetToken = jwt.sign(
      {
        id: creator.id,
        purpose: 'password-reset',
        version: creator.passwordVersion
      },
      process.env.JWT_SECRET,
      { expiresIn: '30m' }
    );

    // Send reset email
    const emailResult = await sendPasswordResetEmail(email, resetToken, creator.name);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

    res.json({
      success: true,
      message: 'If an account exists, a password reset link has been sent'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'A valid email is required'
      });
    }
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = z
      .object({ token: z.string().min(1), newPassword: passwordSchema })
      .parse(req.body);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.purpose !== 'password-reset') {
      throw new Error('Invalid token purpose');
    }

    const creator = await prisma.creator.findUnique({
      where: { id: decoded.id },
      select: { passwordVersion: true }
    });
    if (!creator || creator.passwordVersion !== decoded.version) {
      throw new Error('Reset token has already been used');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.$transaction([
      prisma.creator.update({
        where: { id: decoded.id },
        data: {
          passwordHash,
          passwordVersion: { increment: 1 }
        }
      }),
      prisma.refreshToken.deleteMany({ where: { creatorId: decoded.id } })
    ]);

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
    const credentials = z
      .object({ email: z.string().email(), password: z.string().min(1).max(128) })
      .parse(req.body);
    const email = normalizeEmail(credentials.email);

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

    const isValidPassword = await bcrypt.compare(credentials.password, admin.passwordHash);

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
      { expiresIn: '2h' }
    );

    res.cookie('adminToken', adminToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 2 * 60 * 60 * 1000,
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
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Valid email and password are required'
      });
    }
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
            status: true,
            passwordVersion: true
          }
        });
        
        if (
          user &&
          user.status === 'active' &&
          user.passwordVersion === decoded.version
        ) {
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
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

export default router;
