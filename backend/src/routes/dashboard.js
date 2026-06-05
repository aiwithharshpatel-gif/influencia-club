import express from 'express';
import { z } from 'zod';
import { protect } from '../middleware/auth.js';
import { getPointsHistory, getReferralStats } from '../services/pointsService.js';
import prisma from '../lib/prisma.js';
import { safeErrorMessage } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const router = express.Router();

const REWARD_COSTS = Object.freeze({
  featured: 200,
  ig_promo: 150,
  event_entry: 100,
  collab_priority: 300
});

// All routes require authentication
router.use(protect);

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        pointsBalance: true,
        isVerified: true,
        isFeatured: true,
        isApproved: true,
        photoUrl: true,
        category: true,
        city: true,
        instagram: true,
        followerCount: true,
        bio: true,
        createdAt: true
      }
    });

    // Get referral count
    const referralCount = await prisma.referral.count({
      where: { referrerId: req.user.id, status: 'confirmed' }
    });

    // Get active collabs count
    const activeCollabs = await prisma.campaignCreator.count({
      where: {
        creatorId: req.user.id,
        status: { in: ['invited', 'confirmed'] }
      }
    });

    // Calculate profile completion
    let completion = 0;
    if (creator.photoUrl) completion += 20;
    if (creator.bio) completion += 20;
    if (creator.followerCount) completion += 20;
    if (creator.isVerified) completion += 20;
    completion += 20; // Base for having basic info

    res.json({
      success: true,
      data: {
        creator,
        referralCount,
        activeCollabs,
        profileCompletion: completion
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

// Get points balance and history
router.get('/points', async (req, res) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id },
      select: {
        pointsBalance: true
      }
    });

    const history = await getPointsHistory(req.user.id);

    res.json({
      success: true,
      data: {
        balance: creator.pointsBalance,
        history
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

// Get referrals
router.get('/referrals', async (req, res) => {
  try {
    const stats = await getReferralStats(req.user.id);

    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id },
      select: {
        referralCode: true
      }
    });

    res.json({
      success: true,
      data: {
        referralCode: creator.referralCode,
        ...stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

// Get collab history
router.get('/collabs', async (req, res) => {
  try {
    const collabs = await prisma.campaignCreator.findMany({
      where: { creatorId: req.user.id },
      include: {
        campaign: {
          include: {
            brandInquiry: {
              select: {
                brandName: true,
                packageType: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      collabs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

// Submit redemption request
router.post('/redeem', async (req, res) => {
  try {
    const { rewardType } = z
      .object({
        rewardType: z.enum(['featured', 'ig_promo', 'event_entry', 'collab_priority'])
      })
      .parse(req.body);
    const pointsCost = REWARD_COSTS[rewardType];

    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id }
    });

    if (creator.pointsBalance < pointsCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    const existingPending = await prisma.redemptionRequest.findFirst({
      where: {
        creatorId: req.user.id,
        rewardType,
        status: 'pending'
      }
    });

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'A request for this reward is already pending'
      });
    }

    const redemption = await prisma.redemptionRequest.create({
      data: { creatorId: req.user.id, rewardType, pointsCost }
    });

    res.json({
      success: true,
      message: 'Redemption request submitted',
      redemption
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward'
      });
    }
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

const profileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
  category: z.enum(['influencer', 'actor', 'model', 'creator', 'public_figure']).optional(),
  instagram: z.string().max(100).regex(/^@?[A-Za-z0-9._]+$/).optional(),
  mobile: z.string().regex(/^[6-9]\d{9}$/).optional(),
  followerCount: z.string().max(20).optional().or(z.literal('')),
  photoUrl: z.string().url().optional().or(z.literal(''))
}).strict();

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const validated = profileUpdateSchema.parse(req.body);
    
    // Explicitly exclude admin-only fields to be safe
    // But we only use validated data anyway
    const updateData = {};
    Object.keys(validated).forEach(key => {
      if (validated[key] !== undefined) {
        updateData[key] = validated[key];
      }
    });
    if (updateData.instagram) {
      updateData.instagram = updateData.instagram.toLowerCase().replace(/^@/, '');
    }

    const creator = await prisma.creator.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        instagram: true,
        category: true,
        city: true,
        bio: true,
        photoUrl: true,
        mobile: true,
        followerCount: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      creator
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues
      });
    }
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

export default router;
