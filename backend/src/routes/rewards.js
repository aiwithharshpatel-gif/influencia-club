import express from 'express';
import prisma from '../lib/prisma.js';
import { protect } from '../middleware/auth.js';
import { updateCreatorTier } from '../services/pointsService.js';

const router = express.Router();

// All routes require creator authentication
router.use(protect);

const REWARD_CATALOG = [
  {
    id: 'featured',
    title: 'Featured Creator Spot',
    description: 'Get featured on the homepage dashboard for 7 days to get maximum brand visibility.',
    cost: 100,
    type: 'featured',
    badge: 'Popular'
  },
  {
    id: 'ig_promo',
    title: 'Instagram Boost Promotion',
    description: 'We will promote your profile and top collaborations on the official Influenzia Club Instagram handle.',
    cost: 250,
    type: 'ig_promo',
    badge: 'Fast Growth'
  },
  {
    id: 'collab_priority',
    title: 'Premium Collab Invite',
    description: 'Receive priority access and invites to high-paying premium campaigns before other creators.',
    cost: 300,
    type: 'collab_priority',
    badge: 'VIP'
  },
  {
    id: 'event_entry',
    title: 'Exclusive Influencer Event VIP Pass',
    description: 'Access pass to our yearly offline networking event with top brands and leading creators.',
    cost: 500,
    type: 'event_entry',
    badge: 'Premium'
  }
];

// Get marketplace dashboard data
router.get('/marketplace', async (req, res) => {
  try {
    const creatorId = req.user.id;

    // Fetch creator details
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        pointsBalance: true,
        tier: true
      }
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    // Get lifetime points earned by summing all positive 'earn' points
    const earnedPointsAggregate = await prisma.pointsTransaction.aggregate({
      where: {
        creatorId,
        type: 'earn'
      },
      _sum: {
        points: true
      }
    });
    const lifetimePoints = earnedPointsAggregate._sum.points || 0;

    // Calculate progression details
    let nextTier = null;
    let pointsNeeded = 0;
    let progressPercent = 100;
    let currentTierMin = 0;
    let nextTierMin = 0;

    if (creator.tier === 'silver') {
      nextTier = 'gold';
      currentTierMin = 0;
      nextTierMin = 200;
      pointsNeeded = Math.max(0, 200 - lifetimePoints);
      progressPercent = Math.min(100, Math.max(0, (lifetimePoints / 200) * 100));
    } else if (creator.tier === 'gold') {
      nextTier = 'platinum';
      currentTierMin = 200;
      nextTierMin = 500;
      pointsNeeded = Math.max(0, 500 - lifetimePoints);
      progressPercent = Math.min(100, Math.max(0, ((lifetimePoints - 200) / 300) * 100));
    } else {
      nextTier = 'max';
      currentTierMin = 500;
      nextTierMin = 500;
      pointsNeeded = 0;
      progressPercent = 100;
    }

    // Get leaderboard: top 5 creators by pointsBalance
    const leaderboard = await prisma.creator.findMany({
      where: {
        isApproved: true,
        status: 'active'
      },
      orderBy: {
        pointsBalance: 'desc'
      },
      take: 5,
      select: {
        id: true,
        name: true,
        photoUrl: true,
        pointsBalance: true,
        tier: true
      }
    });

    // Get pending/completed redemptions for this creator
    const redemptions = await prisma.redemptionRequest.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    res.json({
      success: true,
      data: {
        creator: {
          ...creator,
          lifetimePoints
        },
        progression: {
          currentTier: creator.tier,
          nextTier,
          pointsNeeded,
          progressPercent,
          lifetimePoints,
          currentTierMin,
          nextTierMin
        },
        leaderboard,
        redemptions,
        catalog: REWARD_CATALOG
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Submit a redemption request and deduct points immediately
router.post('/redeem', async (req, res) => {
  try {
    const { rewardType } = req.body;
    const creatorId = req.user.id;

    // Find the item in the catalog
    const catalogItem = REWARD_CATALOG.find(item => item.type === rewardType);
    if (!catalogItem) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward type'
      });
    }

    const pointsCost = catalogItem.cost;

    // Execute in transaction to prevent double spending
    const redemption = await prisma.$transaction(async (tx) => {
      const creator = await tx.creator.findUnique({
        where: { id: creatorId },
        select: { pointsBalance: true }
      });

      if (!creator || creator.pointsBalance < pointsCost) {
        throw new Error('Insufficient points balance');
      }

      // Deduct points from creator balance immediately
      await tx.creator.update({
        where: { id: creatorId },
        data: {
          pointsBalance: { decrement: pointsCost }
        }
      });

      // Create negative points transaction
      await tx.pointsTransaction.create({
        data: {
          creatorId,
          type: 'redeem',
          reason: 'redemption',
          points: -pointsCost,
          note: `Redeemed ${catalogItem.title}`
        }
      });

      // Create redemption request in pending state
      const request = await tx.redemptionRequest.create({
        data: {
          creatorId,
          rewardType,
          pointsCost,
          status: 'pending'
        }
      });

      // Recalculate tier (re-running updateCreatorTier inside transaction is safe)
      await updateCreatorTier(tx, creatorId);

      return request;
    });

    res.json({
      success: true,
      message: 'Redemption request submitted successfully. Points have been deducted.',
      redemption
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Test endpoint to grant points during E2E automation
router.post('/test-grant', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ success: false, message: 'Forbidden in production' });
  }
  try {
    const { secret, points } = req.body;
    if (secret !== (process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden'
      });
    }

    const creatorId = req.user.id;

    const creator = await prisma.$transaction(async (tx) => {
      await tx.creator.update({
        where: { id: creatorId },
        data: {
          pointsBalance: { increment: points }
        }
      });

      await tx.pointsTransaction.create({
        data: {
          creatorId,
          type: 'earn',
          reason: 'admin_grant',
          points,
          note: 'E2E Test points grant'
        }
      });

      return await updateCreatorTier(tx, creatorId);
    });

    res.json({
      success: true,
      message: `Granted ${points} points for testing`,
      creator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
