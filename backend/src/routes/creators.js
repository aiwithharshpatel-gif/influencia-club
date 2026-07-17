import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { fetchInstagramData, getLongLivedAccessToken } from '../services/instagramService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get all creators (public)
router.get('/', async (req, res) => {
  try {
    const { category, city, search, featured } = req.query;

    const where = {
      isApproved: true,
      status: 'active'
    };

    if (category && category !== 'all') {
      where.category = category;
    }

    if (city && city !== 'all') {
      where.city = city;
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } }
      ];
    }

    const creators = await prisma.creator.findMany({
      where,
      select: {
        id: true,
        name: true,
        photoUrl: true,
        category: true,
        city: true,
        instagram: true,
        followerCount: true,
        isVerified: true,
        isFeatured: true,
        bio: true,
        createdAt: true
      },
      orderBy: {
        isFeatured: 'desc',
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      count: creators.length,
      creators
    });
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get Waitlist Leaderboard (Public)
router.get('/leaderboard', async (req, res) => {
  try {
    const rawLeaderboard = await prisma.creator.findMany({
      where: {
        status: 'active',
        isApproved: true
      },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        category: true,
        city: true,
        isVerified: true,
        tier: true,
        pointsBalance: true,
        referralCode: true,
        _count: {
          select: { referrals: true }
        }
      },
      orderBy: [
        { pointsBalance: 'desc' },
        { referrals: { _count: 'desc' } }
      ],
      take: 50
    });

    const leaderboard = rawLeaderboard.map((item, index) => ({
      rank: index + 1,
      id: item.id,
      name: item.name,
      photoUrl: item.photoUrl,
      category: item.category,
      city: item.city,
      isVerified: item.isVerified,
      tier: item.tier,
      pointsBalance: item.pointsBalance,
      referralCode: item.referralCode,
      referralsCount: item._count.referrals
    }));

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Waitlist leaderboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve waitlist leaderboard'
    });
  }
});

// Get single creator (public)
router.get('/:id', async (req, res) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        category: true,
        city: true,
        instagram: true,
        followerCount: true,
        isVerified: true,
        isFeatured: true,
        bio: true,
        createdAt: true,
        instagramProfile: true
      }
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    res.json({
      success: true,
      creator
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

/**
 * Get logged-in creator's connected Instagram Profile details
 * GET /api/creators/instagram/profile
 */
router.get('/instagram/profile', protect, async (req, res) => {
  try {
    const profile = await prisma.instagramProfile.findUnique({
      where: { creatorId: req.user.id }
    });

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Fetch connected Instagram profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve connected Instagram profile'
    });
  }
});

/**
 * Connect Instagram Professional Account via mock code
 * POST /api/creators/instagram/connect
 */
router.post('/instagram/connect', protect, async (req, res) => {
  try {
    const { code, username } = req.body;

    // Exchange auth code for long-lived access token if not mock
    const isMock = !code || code.startsWith('mock_');
    const redirectUri = `${process.env.FRONTEND_URL}/oauth/instagram/callback`;
    const accessToken = isMock ? (code || 'mock_access_token_123') : await getLongLivedAccessToken(code, redirectUri);

    // Call mock/real Meta API service to get stats
    // Real Meta tokens resolve the username automatically via the /me endpoint
    const igData = await fetchInstagramData(accessToken, username || '');

    if (!igData || !igData.username) {
      return res.status(400).json({
        success: false,
        message: 'Failed to resolve Instagram profile username'
      });
    }

    const cleanedUsername = igData.username.replace(/^@/, '').trim();

    // Save or update Instagram Profile data
    const profile = await prisma.instagramProfile.upsert({
      where: { creatorId: req.user.id },
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
        creatorId: req.user.id,
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

    // Update Creator table's follower count and handle
    const formattedFollowers = formatFollowers(igData.followersCount);
    await prisma.creator.update({
      where: { id: req.user.id },
      data: {
        instagram: cleanedUsername,
        followerCount: formattedFollowers
      }
    });

    res.json({
      success: true,
      message: 'Instagram profile connected successfully!',
      profile
    });
  } catch (error) {
    console.error('Connect Instagram profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to connect Instagram profile'
    });
  }
});

/**
 * Refresh connected Instagram profile statistics manually
 * POST /api/creators/instagram/refresh
 */
router.post('/instagram/refresh', protect, async (req, res) => {
  try {
    const profile = await prisma.instagramProfile.findUnique({
      where: { creatorId: req.user.id }
    });

    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Instagram profile not connected'
      });
    }

    // Call Meta API mock service
    const igData = await fetchInstagramData(profile.accessToken || 'mock_access_token_123', profile.username);

    // Save updated statistics
    const updatedProfile = await prisma.instagramProfile.update({
      where: { id: profile.id },
      data: {
        fullName: igData.fullName,
        profilePicUrl: igData.profilePicUrl,
        followersCount: igData.followersCount,
        mediaCount: igData.mediaCount,
        engagementRate: igData.engagementRate,
        avgLikes: igData.avgLikes,
        avgComments: igData.avgComments,
        recentPosts: igData.recentPosts
      }
    });

    // Update parent Creator
    const formatted = formatFollowers(igData.followersCount);
    await prisma.creator.update({
      where: { id: req.user.id },
      data: {
        followerCount: formatted
      }
    });

    res.json({
      success: true,
      message: 'Instagram statistics refreshed successfully!',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Refresh Instagram profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to refresh Instagram statistics'
    });
  }
});

/**
 * Disconnect Instagram Profile
 * POST /api/creators/instagram/disconnect
 */
router.post('/instagram/disconnect', protect, async (req, res) => {
  try {
    // Delete connected Instagram profile
    await prisma.instagramProfile.delete({
      where: { creatorId: req.user.id }
    });

    // Reset followerCount inside Creator model
    await prisma.creator.update({
      where: { id: req.user.id },
      data: {
        followerCount: null
      }
    });

    res.json({
      success: true,
      message: 'Instagram profile disconnected successfully!'
    });
  } catch (error) {
    console.error('Disconnect Instagram profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Instagram profile'
    });
  }
});

export default router;
