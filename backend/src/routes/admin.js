import express from 'express';
import prisma from '../lib/prisma.js';
import { adminProtect } from '../middleware/auth.js';
import { safeErrorMessage } from '../middleware/errorHandler.js';
import { updateCreatorTier } from '../services/pointsService.js';
import { runInstagramAutoSync } from '../services/instagramSyncScheduler.js';
import { createNotification } from '../services/notificationInboxService.js';

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
        { name: { contains: search } },
        { email: { contains: search } },
        { instagram: { contains: search } }
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

    // Notify creator if approved or verified
    const io = req.app.get('io');
    if (isApproved === true) {
      await createNotification({
        recipientId: id,
        recipientType: 'creator',
        type: 'approval',
        title: 'Account Approved! 🎉',
        message: 'Congratulations! Your creator profile has been approved by the admin team. You can now participate in campaigns.',
        link: '/dashboard/profile'
      }, io);
    }
    if (isVerified === true) {
      await createNotification({
        recipientId: id,
        recipientType: 'creator',
        type: 'approval',
        title: 'Verified Badge Granted! ⭐',
        message: 'Your profile has been verified by the admin team. A verification badge is now shown on your profile.',
        link: '/dashboard/profile'
      }, io);
    }

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

// Suspend creator
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

// Permanently delete creator (cascading all relations)
router.delete('/creators/:id/permanent', async (req, res) => {
  try {
    const { id } = req.params;

    const creator = await prisma.creator.findUnique({
      where: { id }
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    // 1. Delete OTP verifications
    await prisma.otpVerification.deleteMany({
      where: { email: creator.email }
    });

    // 2. Delete point transactions (PointsTransaction model)
    await prisma.pointsTransaction.deleteMany({
      where: { creatorId: id }
    });

    // 3. Delete redemption requests
    await prisma.redemptionRequest.deleteMany({
      where: { creatorId: id }
    });

    // 4. Delete referrals
    await prisma.referral.deleteMany({
      where: {
        OR: [
          { referrerId: id },
          { referredId: id }
        ]
      }
    });

    // 5. Find all campaign creators for this creator & delete milestones
    const campaignCreators = await prisma.campaignCreator.findMany({
      where: { creatorId: id }
    });

    for (const cc of campaignCreators) {
      await prisma.milestone.deleteMany({
        where: { campaignCreatorId: cc.id }
      });
    }

    // 6. Delete campaign creators
    await prisma.campaignCreator.deleteMany({
      where: { creatorId: id }
    });

    // 7. Delete campaign applications
    await prisma.campaignApplication.deleteMany({
      where: { creatorId: id }
    });

    // 8. Delete payments & payouts
    await prisma.payment.deleteMany({
      where: { creatorId: id }
    });
    await prisma.payout.deleteMany({
      where: { creatorId: id }
    });

    // 9. Delete creator analytics
    await prisma.creatorAnalytics.deleteMany({
      where: { creatorId: id }
    });

    // 10. Delete notifications
    await prisma.notification.deleteMany({
      where: {
        recipientId: id
      }
    });

    // 11. Delete messages (Message model)
    await prisma.message.deleteMany({
      where: {
        OR: [
          { senderId: id },
          { recipientId: id }
        ]
      }
    });

    // 12. Delete instagram profile
    await prisma.instagramProfile.deleteMany({
      where: { creatorId: id }
    });

    // 13. Unlink any brand inquiries assigned to this creator
    await prisma.brandInquiry.updateMany({
      where: { assignedTo: id },
      data: { assignedTo: null }
    });

    // 14. Delete the creator
    await prisma.creator.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Creator and all associated data permanently deleted'
    });
  } catch (error) {
    console.error('Permanent delete creator error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to permanently delete creator'
    });
  }
});

// Delete brand inquiry (cascading campaigns and collabs)
router.delete('/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const inquiry = await prisma.brandInquiry.findUnique({
      where: { id },
      include: {
        campaigns: {
          include: {
            campaignCreators: true
          }
        }
      }
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    // Delete milestones for all campaign creators under this inquiry
    for (const camp of inquiry.campaigns) {
      for (const cc of camp.campaignCreators) {
        await prisma.milestone.deleteMany({
          where: { campaignCreatorId: cc.id }
        });
      }
      await prisma.campaignCreator.deleteMany({
        where: { campaignId: camp.id }
      });
      await prisma.campaignApplication.deleteMany({
        where: { campaignId: camp.id }
      });
    }

    // Delete campaigns
    await prisma.campaign.deleteMany({
      where: { brandInquiryId: id }
    });

    // Delete payments linked to this inquiry
    await prisma.payment.deleteMany({
      where: { brandInquiryId: id }
    });

    // Delete inquiry
    await prisma.brandInquiry.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Inquiry and all associated campaigns deleted successfully'
    });
  } catch (error) {
    console.error('Delete inquiry error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete inquiry'
    });
  }
});

// Clean up all test profiles and test data
router.post('/cleanup-test-data', async (req, res) => {
  try {
    const { cleanupTestData } = await import('../clean_test_data.js');
    await cleanupTestData();
    res.json({
      success: true,
      message: 'All test profiles and test data cleaned up successfully'
    });
  } catch (error) {
    console.error('Cleanup test data error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cleanup test data'
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
            id: true,
            name: true,
            email: true,
            instagram: true,
            photoUrl: true
          }
        },
        campaigns: {
          include: {
            campaignCreators: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    instagram: true,
                    photoUrl: true
                  }
                },
                milestones: true
              }
            }
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

// Update inquiry status & sync creator collaborations
router.put('/inquiries/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, packageType } = req.body;

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo || null;
    if (packageType) updateData.packageType = packageType;

    const inquiry = await prisma.brandInquiry.update({
      where: { id },
      data: updateData,
      include: {
        assignedCreator: {
          select: {
            id: true,
            name: true,
            email: true,
            instagram: true
          }
        }
      }
    });

    // When assignedTo is set, automatically create or link Campaign and CampaignCreator collaboration
    if (assignedTo) {
      let campaign = await prisma.campaign.findFirst({
        where: { brandInquiryId: id }
      });

      if (!campaign) {
        campaign = await prisma.campaign.create({
          data: {
            brandInquiryId: id,
            title: `${inquiry.brandName} Campaign`,
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            notes: `Auto-generated campaign for ${inquiry.brandName}`,
            status: 'active'
          }
        });
      }

      // Check if CampaignCreator collaboration exists
      let campaignCreator = await prisma.campaignCreator.findFirst({
        where: {
          campaignId: campaign.id,
          creatorId: assignedTo
        }
      });

      if (!campaignCreator) {
        campaignCreator = await prisma.campaignCreator.create({
          data: {
            campaignId: campaign.id,
            creatorId: assignedTo,
            deliverables: inquiry.message || 'Brand campaign collaboration deliverables.',
            status: 'confirmed'
          }
        });
      } else {
        await prisma.campaignCreator.update({
          where: { id: campaignCreator.id },
          data: { status: 'confirmed' }
        });
      }

      // Check and generate default milestones
      const existingMilestones = await prisma.milestone.count({
        where: { campaignCreatorId: campaignCreator.id }
      });

      if (existingMilestones === 0) {
        const defaultMilestones = [
          { type: 'script_approval', title: '1. Script & Concept Approval', description: 'Submit content concept and script outline for brand review', sortOrder: 0, status: 'in_progress' },
          { type: 'content_draft', title: '2. Draft Content Review', description: 'Upload draft video / photos for review and feedback', sortOrder: 1, status: 'pending' },
          { type: 'final_post', title: '3. Final Live Post & Metrics', description: 'Publish final content and provide link / performance metrics', sortOrder: 2, status: 'pending' }
        ];

        for (const m of defaultMilestones) {
          await prisma.milestone.create({
            data: {
              campaignCreatorId: campaignCreator.id,
              ...m
            }
          });
        }
      }

      // Send notification to creator
      const io = req.app.get('io');
      await createNotification({
        recipientId: assignedTo,
        recipientType: 'creator',
        type: 'collab',
        title: 'New Collaboration Offer! 💼',
        message: `You have been selected for a collaboration with ${inquiry.brandName}!`,
        link: '/dashboard/collabs'
      }, io);
    }

    res.json({
      success: true,
      message: 'Inquiry updated and collaboration synced successfully',
      inquiry
    });
  } catch (error) {
    console.error('Update inquiry error:', error);
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

    // Check if inquiry has an assigned creator
    const inquiry = await prisma.brandInquiry.findUnique({
      where: { id: brandInquiryId }
    });

    if (inquiry && inquiry.assignedTo) {
      // Create campaign creator collaboration automatically
      await prisma.campaignCreator.create({
        data: {
          campaignId: campaign.id,
          creatorId: inquiry.assignedTo,
          deliverables: notes || 'Campaign deliverables negotiated by admin.',
          status: 'confirmed'
        }
      });
    }

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

    if (status === 'rejected') {
      // Refund points since they were already deducted on submission
      await prisma.$transaction(async (tx) => {
        await tx.creator.update({
          where: { id: redemption.creatorId },
          data: {
            pointsBalance: { increment: redemption.pointsCost }
          }
        });

        await tx.pointsTransaction.create({
          data: {
            creatorId: redemption.creatorId,
            type: 'earn',
            reason: 'admin_grant',
            points: redemption.pointsCost,
            note: `Refund for rejected redemption of ${redemption.rewardType}`
          }
        });

        await updateCreatorTier(tx, redemption.creatorId);
      });
    }

    const updated = await prisma.redemptionRequest.update({
      where: { id },
      data: { status, adminNote }
    });

    // Notify creator
    const io = req.app.get('io');
    if (status === 'approved') {
      await createNotification({
        recipientId: redemption.creatorId,
        recipientType: 'creator',
        type: 'system',
        title: 'Redemption Approved! 🎁',
        message: `Your redemption request for "${redemption.rewardType.replace(/_/g, ' ')}" has been approved. Note: ${adminNote || 'Processed.'}`,
        link: '/dashboard/points'
      }, io);
    } else if (status === 'rejected') {
      await createNotification({
        recipientId: redemption.creatorId,
        recipientType: 'creator',
        type: 'system',
        title: 'Redemption Rejected ❌',
        message: `Your redemption request for "${redemption.rewardType.replace(/_/g, ' ')}" was rejected. Points have been refunded. Note: ${adminNote || 'No reason provided.'}`,
        link: '/dashboard/points'
      }, io);
    }

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
          note: note || 'Manual grant by admin'
        }
      });

      return await updateCreatorTier(tx, creatorId);
    });

    res.json({
      success: true,
      message: `Granted ${points} points`,
      creator: {
        id: creator.id,
        name: creator.name,
        pointsBalance: creator.pointsBalance,
        tier: creator.tier
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

// Bulk refresh all Instagram statistics (admin only)
router.post('/creators/instagram/refresh-all', async (req, res) => {
  try {
    // We execute the auto sync task in background
    runInstagramAutoSync()
      .then(stats => console.log('[Admin Stats Refresh] Completed background refresh:', stats))
      .catch(err => console.error('[Admin Stats Refresh] Background refresh failed:', err));

    res.json({
      success: true,
      message: 'Bulk Instagram statistics refresh triggered in the background'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, process.env.NODE_ENV === 'production')
    });
  }
});

export default router;
