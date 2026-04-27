import express from 'express';
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
    const { page = 1, limit = 20, status, category, city, verified, featured, search } = req.query;

    const where = {};

    if (status) where.status = status;
    if (category && category !== 'all') where.category = category;
    if (city && city !== 'all') where.city = city;
    if (verified === 'true') where.isVerified = true;
    if (featured === 'true') where.isFeatured = true;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { instagram: { contains: search, mode: 'insensitive' } }
      ];
    }

    const creators = await prisma.creator.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
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
          page: parseInt(page),
          limit: parseInt(limit),
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
    const { isApproved, isVerified, isFeatured, status, pointsBalance } = req.body;

    const updateData = {};
    if (typeof isApproved === 'boolean') updateData.isApproved = isApproved;
    if (typeof isVerified === 'boolean') updateData.isVerified = isVerified;
    if (typeof isFeatured === 'boolean') updateData.isFeatured = isFeatured;
    if (status) updateData.status = status;
    if (typeof pointsBalance === 'number') updateData.pointsBalance = pointsBalance;

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
      message: error.message
    });
  }
});

// Get all brand inquiries
router.get('/inquiries', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status && status !== 'all') where.status = status;

    const inquiries = await prisma.brandInquiry.findMany({
      where,
      skip: (page - 1) * limit,
      take: parseInt(limit),
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
          page: parseInt(page),
          limit: parseInt(limit),
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
    const { status, assignedTo, packageType } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (packageType) updateData.packageType = packageType;

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
    const { brandInquiryId, title, startDate, endDate, notes } = req.body;

    const campaign = await prisma.campaign.create({
      data: {
        brandInquiryId,
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        notes
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
      message: error.message
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
    const { status, adminNote } = req.body;

    const redemption = await prisma.redemptionRequest.findUnique({
      where: { id },
      include: { creator: true }
    });

    if (!redemption) {
      return res.status(404).json({
        success: false,
        message: 'Redemption not found'
      });
    }

    if (status === 'approved') {
      // Use transaction to prevent race condition
      await prisma.$transaction(async (tx) => {
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
      });
    }

    const updated = await prisma.redemptionRequest.update({
      where: { id },
      data: { status, adminNote }
    });

    res.json({
      success: true,
      message: `Redemption ${status}`,
      redemption: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Grant points manually
router.post('/points', async (req, res) => {
  try {
    const { creatorId, points, reason, note } = req.body;

    if (!creatorId || !points) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID and points required'
      });
    }

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
