import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { adminProtect } from '../middleware/auth.js';
import { safeErrorMessage } from '../middleware/errorHandler.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminProtect);

// Dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [
      totalCreators,
      pendingCreators,
      totalInquiries,
      newInquiries,
      activeCampaigns,
      totalPoints
    ] = await Promise.all([
      prisma.creator.count(),
      prisma.creator.count({ where: { isApproved: false } }),
      prisma.brandInquiry.count(),
      prisma.brandInquiry.count({ where: { status: 'new' } }),
      prisma.campaign.count({ where: { status: 'active' } }),
      prisma.pointsTransaction.aggregate({
        _sum: { points: true }
      })
    ]);

    const recentInquiries = await prisma.brandInquiry.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        brandName: true,
        email: true,
        budgetRange: true,
        status: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: {
        totalCreators,
        pendingCreators,
        totalInquiries,
        newInquiries,
        activeCampaigns,
        totalPoints: totalPoints._sum.points || 0,
        recentInquiries
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Get all creators (admin)
router.get('/creators', async (req, res) => {
  try {
    const filters = z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      status: z.enum(['active', 'suspended']).optional(),
      category: z.enum(['all', 'influencer', 'actor', 'model', 'creator', 'public_figure']).optional(),
      city: z.string().max(50).optional(),
      verified: z.enum(['true', 'false']).optional(),
      featured: z.enum(['true', 'false']).optional(),
      search: z.string().max(100).optional()
    }).parse(req.query);
    const { page, limit, status, category, city, verified, featured, search } = filters;

    const where = {};

    if (status) where.status = status;
    if (category && category !== 'all') where.category = category;
    if (city && city !== 'all') where.city = city;
    if (verified === 'true') where.isVerified = true;
    if (featured === 'true') where.isFeatured = true;

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { instagram: { contains: search } }
      ];
    }

    const creators = await prisma.creator.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        instagram: true,
        category: true,
        city: true,
        followerCount: true,
        isVerified: true,
        isFeatured: true,
        isApproved: true,
        pointsBalance: true,
        status: true,
        createdAt: true
      }
    });

    const total = await prisma.creator.count({ where });

    res.json({
      success: true,
      data: {
        creators,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Update creator (approve, verify, feature, suspend)
router.put('/creators/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const changes = z.object({
      isApproved: z.boolean().optional(),
      isVerified: z.boolean().optional(),
      isFeatured: z.boolean().optional(),
      status: z.enum(['active', 'suspended']).optional()
    }).strict().parse(req.body);

    const updateData = {};
    if (typeof changes.isApproved === 'boolean') updateData.isApproved = changes.isApproved;
    if (typeof changes.isVerified === 'boolean') updateData.isVerified = changes.isVerified;
    if (typeof changes.isFeatured === 'boolean') updateData.isFeatured = changes.isFeatured;
    if (changes.status) updateData.status = changes.status;

    const creator = await prisma.creator.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isApproved: true,
        isVerified: true,
        isFeatured: true,
        status: true,
        pointsBalance: true
      }
    });

    res.json({
      success: true,
      message: 'Creator updated successfully',
      creator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Delete/Suspend creator
router.delete('/creators/:id', async (req, res) => {
  try {
    await prisma.creator.update({
      where: { id: req.params.id },
      data: { status: 'suspended' }
    });

    res.json({
      success: true,
      message: 'Creator suspended'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Get all brand inquiries
router.get('/inquiries', async (req, res) => {
  try {
    const filters = z.object({
      status: z.enum(['all', 'new', 'in_progress', 'completed', 'rejected']).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20)
    }).parse(req.query);
    const { status, page, limit } = filters;

    const where = {};
    if (status && status !== 'all') where.status = status;

    const inquiries = await prisma.brandInquiry.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        assignedCreator: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const total = await prisma.brandInquiry.count({ where });

    res.json({
      success: true,
      data: {
        inquiries,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Update inquiry status
router.put('/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const changes = z.object({
      status: z.enum(['new', 'in_progress', 'completed', 'rejected']).optional(),
      assignedTo: z.string().uuid().nullable().optional(),
      packageType: z.enum(['basic', 'growth', 'premium']).nullable().optional()
    }).strict().parse(req.body);

    const updateData = {};
    if (changes.status) updateData.status = changes.status;
    if (changes.assignedTo !== undefined) updateData.assignedTo = changes.assignedTo;
    if (changes.packageType !== undefined) updateData.packageType = changes.packageType;

    const inquiry = await prisma.brandInquiry.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Get all campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      include: {
        brandInquiry: {
          select: {
            brandName: true
          }
        },
        campaignCreators: {
          include: {
            creator: {
              select: {
                name: true,
                photoUrl: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      campaigns
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Create campaign
router.post('/campaigns', async (req, res) => {
  try {
    const input = z.object({
      brandInquiryId: z.string().uuid(),
      title: z.string().min(2).max(200),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      notes: z.string().max(5000).optional()
    }).strict().refine(
      ({ startDate, endDate }) => !startDate || !endDate || endDate >= startDate,
      { message: 'End date must be on or after start date' }
    ).parse(req.body);

    const campaign = await prisma.campaign.create({
      data: {
        brandInquiryId: input.brandInquiryId,
        title: input.title,
        startDate: input.startDate,
        endDate: input.endDate,
        notes: input.notes
      }
    });

    res.json({
      success: true,
      message: 'Campaign created',
      campaign
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Get redemption requests
router.get('/redemptions', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const where = {};
    if (status && status !== 'all') where.status = status;

    const redemptions = await prisma.redemptionRequest.findMany({
      where,
      include: {
        creator: {
          select: {
            name: true,
            email: true,
            pointsBalance: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      redemptions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Approve/Reject redemption
router.put('/redemptions/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const changes = z.object({
      status: z.enum(['approved', 'rejected']),
      adminNote: z.string().max(255).optional()
    }).strict().parse(req.body);

    const updated = await prisma.$transaction(async (tx) => {
      const redemption = await tx.redemptionRequest.findUnique({ where: { id } });
      if (!redemption) {
        const error = new Error('Redemption not found');
        error.status = 404;
        throw error;
      }
      if (redemption.status !== 'pending') {
        const error = new Error('Redemption has already been processed');
        error.status = 409;
        throw error;
      }

      if (changes.status === 'approved') {
        const creator = await tx.creator.findUnique({
          where: { id: redemption.creatorId },
          select: { pointsBalance: true }
        });

        if (!creator || creator.pointsBalance < redemption.pointsCost) {
          throw new Error('Insufficient balance');
        }

        await tx.creator.update({
          where: { id: redemption.creatorId },
          data: {
            pointsBalance: { decrement: redemption.pointsCost }
          }
        });
        await tx.pointsTransaction.create({
          data: {
            creatorId: redemption.creatorId,
            type: 'redeem',
            reason: 'redemption',
            points: -redemption.pointsCost,
            note: `Reward redemption: ${redemption.rewardType}`
          }
        });
      }

      return tx.redemptionRequest.update({
        where: { id },
        data: { status: changes.status, adminNote: changes.adminNote }
      });
    });

    res.json({
      success: true,
      message: `Redemption ${changes.status}`,
      redemption: updated
    });
  } catch (error) {
    res.status(error.status || (error instanceof z.ZodError ? 400 : 500)).json({
      success: false,
      message: error.status || error instanceof z.ZodError
        ? error.message
        : safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Grant points manually
router.post('/points', async (req, res) => {
  try {
    const { creatorId, points, note } = z.object({
      creatorId: z.string().uuid(),
      points: z.coerce.number().int().positive().max(100_000),
      note: z.string().max(255).optional()
    }).strict().parse(req.body);

    // Use transaction to prevent race condition
    const creator = await prisma.$transaction(async (tx) => {
      const updated = await tx.creator.update({
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
          note: note || 'Manual grant by admin'
        }
      });

      return updated;
    });

    res.json({
      success: true,
      message: `Granted ${points} points`,
      creator: {
        id: creator.id,
        name: creator.name,
        pointsBalance: creator.pointsBalance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

export default router;
