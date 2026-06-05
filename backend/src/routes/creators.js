import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { safeErrorMessage } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const router = express.Router();

// Get all creators (public)
router.get('/', async (req, res) => {
  try {
    const filters = z
      .object({
        category: z
          .enum(['all', 'influencer', 'actor', 'model', 'creator', 'public_figure'])
          .optional(),
        city: z.string().max(50).optional(),
        search: z.string().max(100).optional(),
        featured: z.enum(['true', 'false']).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(48).default(24)
      })
      .parse(req.query);
    const { category, city, search, featured, page, limit } = filters;

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
      skip: (page - 1) * limit,
      take: limit,
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
      page,
      creators
    });
  } catch (error) {
    console.error('Get creators error:', error);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Invalid creator filters' : 'Unable to load creators'
    });
  }
});

// Get single creator (public)
router.get('/:id', async (req, res) => {
  try {
    const creator = await prisma.creator.findFirst({
      where: {
        id: req.params.id,
        isApproved: true,
        status: 'active'
      },
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
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

export default router;
