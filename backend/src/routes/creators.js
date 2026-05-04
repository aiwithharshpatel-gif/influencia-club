import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';

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
        createdAt: true
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

export default router;
