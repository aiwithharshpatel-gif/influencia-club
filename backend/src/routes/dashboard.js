import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { getPointsHistory, getReferralStats } from '../services/pointsService.js';

const router = express.Router();
const prisma = new PrismaClient();

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
      message: error.message
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
      message: error.message
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
      message: error.message
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
      message: error.message
    });
  }
});

// Submit redemption request
router.post('/redeem', async (req, res) => {
  try {
    const { rewardType, pointsCost } = req.body;

    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id }
    });

    if (creator.pointsBalance < pointsCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    const redemption = await prisma.redemptionRequest.create({
      data: {
        creatorId: req.user.id,
        rewardType,
        pointsCost
      }
    });

    res.json({
      success: true,
      message: 'Redemption request submitted',
      redemption
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
