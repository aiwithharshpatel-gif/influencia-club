import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { fetchInstagramData } from '../services/instagramService.js';

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
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Instagram username is required'
      });
    }

    const cleanedUsername = username.replace(/^@/, '').trim();

    // Call mock Meta API service to get stats
    const igData = await fetchInstagramData(code || 'mock_access_token_123', cleanedUsername);

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
        accessToken: code || 'mock_access_token_123'
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
        accessToken: code || 'mock_access_token_123'
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
