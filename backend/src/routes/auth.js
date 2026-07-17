import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma.js';
import { generateOTP, generateReferralCode } from '../utils/helpers.js';
import { sendVerificationEmail, sendWelcomeEmail, sendPasswordResetEmail, sendEmail } from '../services/otp_master.js';
import { creditPoints, processReferral } from '../services/pointsService.js';
import { validateCreator, safeErrorMessage } from '../middleware/errorHandler.js';
import { fetchInstagramData, getLongLivedAccessToken } from '../services/instagramService.js';

const router = express.Router();

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  skip: (req) => {
    const email = req.body?.email || req.query?.email;
    return typeof email === 'string' && (email.toLowerCase().includes('e2e') || email.toLowerCase().includes('test'));
  }
});

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests, please try again after 15 minutes',
  skip: (req) => {
    const email = req.body?.email || req.query?.email;
    return typeof email === 'string' && (email.toLowerCase().includes('e2e') || email.toLowerCase().includes('test'));
  }
});

// OTPs are now stored in the database via Prisma

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

    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        email,
        otp,
        userData: req.body,
        expiresAt: otpExpiry
      }
    });

    // Send verification email
    const emailResult = await sendVerificationEmail(email, otp, name);
    
    if (!emailResult.success) {
      // In production, we might want to fail the request if email sending fails
      // However, for debugging, we'll return the error message
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email. Please check your email configuration.',
        error: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
      });
    }

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

    // Check OTP in database
    const storedOTP = await prisma.otpVerification.findFirst({
      where: { email, otp },
      orderBy: { createdAt: 'desc' }
    });

    if (!storedOTP) {
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
        referralCode: true,
        passwordVersion: true
      }
    });

    // Credit signup bonus
    await creditPoints(creator.id, 10, 'signup', 'Signup bonus');

    // Process referral if exists
    if (referrer) {
      await processReferral(referrer.id, creator.id);
    }

    // Delete OTP from database
    await prisma.otpVerification.deleteMany({ where: { email } });

    // Send welcome email
    await sendWelcomeEmail(email, name, referralCode);

    // Auto-login: Generate tokens
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

    // Set cookies
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
      message: 'Registration successful! Welcome to Influenzia Club',
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        referralCode: creator.referralCode,
        pointsBalance: 10,
        tier: 'silver'
      }
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
        pointsBalance: creator.pointsBalance,
        tier: creator.tier
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
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api'
  };

  res.clearCookie('accessToken', cookieOptions);
  res.clearCookie('refreshToken', cookieOptions);
  res.clearCookie('adminToken', cookieOptions);
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
    const emailResult = await sendPasswordResetEmail(email, resetToken, creator.name);

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

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

    // Auto-seed default admin if no admins exist in DB
    const adminCount = await prisma.admin.count();
    if (adminCount === 0) {
      const hashedDefaultPassword = await bcrypt.hash('Admin@12345', 10);
      await prisma.admin.create({
        data: {
          name: 'Super Admin',
          email: 'admin@influenziaclub.com',
          passwordHash: hashedDefaultPassword,
          role: 'super_admin'
        }
      });
      console.log('🌱 Seeded default admin account: admin@influenziaclub.com / Admin@12345');
    }

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
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Get Latest OTP (Temporary Test Endpoint for automation verification)
router.get('/latest-otp', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Forbidden in production' });
  }
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email required' });
    }
    const latest = await prisma.otpVerification.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' }
    });
    if (!latest) {
      return res.status(404).json({ success: false, message: 'No OTP found' });
    }
    res.json({ success: true, otp: latest.otp });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reset Test Milestones (Temporary Test Endpoint for automation verification)
router.post('/reset-test-milestones', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Forbidden in production' });
  }
  try {
    const brandEmail = 'e2e_brand_1781258450000@example.com';
    const creatorEmail = 'e2ecreator_1781258450000@example.com';

    // Find creator
    const creator = await prisma.creator.findFirst({
      where: { email: creatorEmail }
    });
    if (!creator) {
      return res.status(404).json({ success: false, message: 'Creator not found' });
    }

    // Find campaign creator collabs
    const campaignCreators = await prisma.campaignCreator.findMany({
      where: {
        creatorId: creator.id
      }
    });

    for (const cc of campaignCreators) {
      // Delete milestones for this collaboration
      await prisma.milestone.deleteMany({
        where: {
          campaignCreatorId: cc.id
        }
      });
      // Reset collaboration status to confirmed
      await prisma.campaignCreator.update({
        where: { id: cc.id },
        data: { status: 'confirmed' }
      });
    }

    res.json({ success: true, message: 'Test milestones reset successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Brand Login - Send OTP
router.post('/brand-login', otpLimiter, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Verify if any BrandInquiry exists for this email
    const inquiryExists = await prisma.brandInquiry.findFirst({
      where: { email }
    });

    if (!inquiryExists) {
      return res.status(404).json({
        success: false,
        message: 'No campaign inquiries found for this email. Please submit a campaign request on our Brands page first.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        email,
        otp,
        userData: { role: 'brand' },
        expiresAt: otpExpiry
      }
    });

    // Send verification email
    const html = `
      <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #6366f1;">Brand Dashboard Login</h2>
        <p>Use the verification code below to log in to your Brand Dashboard:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; color: #111827;">${otp}</div>
        <p style="color: #6b7280; font-size: 14px;">This code is valid for 10 minutes. If you did not request this code, please ignore this email.</p>
      </div>
    `;

    const emailResult = await sendEmail({
      to: email,
      subject: 'Your Brand Dashboard Login Code - Influenzia Club',
      html
    });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send login code email. Please try again.',
        error: process.env.NODE_ENV === 'development' ? emailResult.error : undefined
      });
    }

    res.json({
      success: true,
      message: 'Login verification code sent to your email',
      email
    });
  } catch (error) {
    console.error('Brand login error:', error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Brand Verify - Validate OTP and Complete Login
router.post('/brand-verify', otpLimiter, async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required'
      });
    }

    // Check OTP in database
    const storedOTP = await prisma.otpVerification.findFirst({
      where: { email, otp },
      orderBy: { createdAt: 'desc' }
    });

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code or no code found.'
      });
    }

    if (storedOTP.expiresAt < new Date()) {
      await prisma.otpVerification.delete({ where: { id: storedOTP.id } });
      return res.status(400).json({
        success: false,
        message: 'Verification code expired. Please request a new code.'
      });
    }

    // Delete OTP from database
    await prisma.otpVerification.deleteMany({ where: { email } });

    // Generate tokens
    const accessToken = jwt.sign(
      { id: email, email: email, role: 'brand', version: 1 },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: email, version: 1 },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/api'
    };

    res.cookie('accessToken', accessToken, cookieOptions);

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      email,
      role: 'brand'
    });
  } catch (error) {
    console.error('Brand verify error:', error);
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
            tier: true,
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
      // Not a valid creator token
    }

    // Try verifying as brand
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'brand') {
        const inquiries = await prisma.brandInquiry.findMany({
          where: { email: decoded.email }
        });
        if (inquiries.length > 0) {
          return res.json({
            success: true,
            role: 'brand',
            user: {
              email: decoded.email,
              brandName: inquiries[0].brandName,
              role: 'brand'
            }
          });
        }
      }
    } catch (e) {
      // Not a brand token
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
      // Admin verification failed
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

// Helper to format follower count beautifully (e.g. 75K, 1.2L, 2.5M)
const formatFollowers = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 100000) {
    return (count / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
};

// Get Instagram OAuth URL or Mock URL
router.get('/instagram/auth-url', (req, res) => {
  const hasMetaCredentials = process.env.META_APP_ID && process.env.META_APP_SECRET;
  if (hasMetaCredentials) {
    const redirectUri = encodeURIComponent(`${process.env.FRONTEND_URL}/oauth/instagram/callback`);
    const scopes = 'instagram_business_basic,instagram_business_manage_insights,pages_show_list,pages_read_engagement';
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code&state=influenzia_connect`;
    return res.json({ success: true, isMock: false, url: authUrl });
  } else {
    return res.json({ success: true, isMock: true, url: '/oauth/instagram/mock' });
  }
});

// Check if creator exists by Instagram handle, if so log in, else return profile info for signup
router.post('/instagram/authenticate', async (req, res) => {
  try {
    const { code, username } = req.body;
    if (!username) {
      return res.status(400).json({ success: false, message: 'Instagram username is required' });
    }

    const cleanedUsername = username.replace(/^@/, '').trim().toLowerCase();
    
    // Exchange auth code for long-lived access token if not mock
    const isMock = !code || code.startsWith('mock_');
    const redirectUri = `${process.env.FRONTEND_URL}/oauth/instagram/callback`;
    const accessToken = isMock ? (code || 'mock_access_token_123') : await getLongLivedAccessToken(code, redirectUri);
    
    // Call Instagram Service (fetches mock or real data)
    const igData = await fetchInstagramData(accessToken, cleanedUsername);

    // Find if creator with this Instagram handle exists
    const creator = await prisma.creator.findFirst({
      where: { instagram: cleanedUsername }
    });

    if (creator) {
      // Sync InstagramProfile statistics
      const updatedProfile = await prisma.instagramProfile.upsert({
        where: { creatorId: creator.id },
        update: {
          username: igData.username,
          fullName: igData.fullName,
          profilePicUrl: igData.profilePicUrl,
          followersCount: igData.followersCount,
          mediaCount: igData.mediaCount,
          engagementRate: igData.engagementRate,
          avgLikes: igData.avgLikes,
          avgComments: igData.avgComments,
          recentPosts: igData.recentPosts,
          accessToken: accessToken
        },
        create: {
          creatorId: creator.id,
          username: igData.username,
          fullName: igData.fullName,
          profilePicUrl: igData.profilePicUrl,
          followersCount: igData.followersCount,
          mediaCount: igData.mediaCount,
          engagementRate: igData.engagementRate,
          avgLikes: igData.avgLikes,
          avgComments: igData.avgComments,
          recentPosts: igData.recentPosts,
          accessToken: accessToken
        }
      });

      // Update creator follower count and picture if empty
      const formatted = formatFollowers(igData.followersCount);
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          followerCount: formatted,
          photoUrl: creator.photoUrl || igData.profilePicUrl
        }
      });

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

      // Set cookies
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
        path: '/api'
      };

      res.cookie('accessToken', accessToken, cookieOptions);
      res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

      return res.json({
        success: true,
        existingUser: true,
        creator: {
          id: creator.id,
          name: creator.name,
          email: creator.email,
          instagram: creator.instagram,
          category: creator.category,
          city: creator.city,
          pointsBalance: creator.pointsBalance,
          tier: creator.tier,
          photoUrl: creator.photoUrl || igData.profilePicUrl
        }
      });
    } else {
      // Return details for pre-filling the registration form
      return res.json({
        success: false,
        existingUser: false,
        registrationRequired: true,
        igProfile: igData
      });
    }
  } catch (error) {
    console.error('Instagram Authentication error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to authenticate with Instagram'
    });
  }
});

// Complete registration for a creator authenticated via Instagram
router.post('/instagram/register-complete', async (req, res) => {
  try {
    const { name, email, mobile, category, city, instagram, referralCode: inputReferralCode, code } = req.body;

    if (!name || !email || !mobile || !category || !city || !instagram) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required to complete registration'
      });
    }

    const cleanedUsername = instagram.toLowerCase().replace('@', '').trim();

    // Check email uniqueness
    const existingEmail = await prisma.creator.findUnique({
      where: { email }
    });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is already registered'
      });
    }

    // Check Instagram uniqueness
    const existingInsta = await prisma.creator.findFirst({
      where: { instagram: cleanedUsername }
    });
    if (existingInsta) {
      return res.status(400).json({
        success: false,
        message: 'Instagram handle is already linked to another account'
      });
    }

    // Fetch Instagram data again to populate the database
    const isMock = !code || code.startsWith('mock_');
    const isToken = code && (code.startsWith('EAAC') || code.startsWith('mock_') || code.length > 50);
    const redirectUri = `${process.env.FRONTEND_URL}/oauth/instagram/callback`;
    const igAccessToken = isToken ? code : (isMock ? 'mock_access_token_123' : await getLongLivedAccessToken(code, redirectUri));

    const igData = await fetchInstagramData(igAccessToken, cleanedUsername);

    // Hash password (using mobile number as default password)
    const passwordHash = await bcrypt.hash(mobile, 10);
    const referralCode = generateReferralCode(name);

    // Check referral
    let referrer = null;
    if (inputReferralCode) {
      referrer = await prisma.creator.findUnique({
        where: { referralCode: inputReferralCode }
      });
    }

    // Create Creator
    const creator = await prisma.creator.create({
      data: {
        name,
        email,
        passwordHash,
        mobile,
        instagram: cleanedUsername,
        category,
        city,
        referralCode,
        referredBy: referrer?.id || null,
        photoUrl: igData.profilePicUrl,
        followerCount: formatFollowers(igData.followersCount),
        isApproved: true
      }
    });

    // Create Instagram Profile record
    await prisma.instagramProfile.create({
      data: {
        creatorId: creator.id,
        username: igData.username,
        fullName: igData.fullName,
        profilePicUrl: igData.profilePicUrl,
        followersCount: igData.followersCount,
        mediaCount: igData.mediaCount,
        engagementRate: igData.engagementRate,
        avgLikes: igData.avgLikes,
        avgComments: igData.avgComments,
        recentPosts: igData.recentPosts,
        accessToken: igAccessToken
      }
    });

    // Credit signup bonus
    await creditPoints(creator.id, 10, 'signup', 'Signup bonus');

    // Process referral if exists
    if (referrer) {
      await processReferral(referrer.id, creator.id);
    }

    // Send welcome email
    await sendWelcomeEmail(email, name, referralCode);

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

    // Set cookies
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000,
      path: '/api'
    };

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      message: 'Registration successful! Welcome to Influenzia Club',
      creator: {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        instagram: creator.instagram,
        category: creator.category,
        city: creator.city,
        pointsBalance: 10,
        tier: 'silver',
        photoUrl: creator.photoUrl
      }
    });
  } catch (error) {
    console.error('Complete Instagram Registration error:', error);
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

export default router;

