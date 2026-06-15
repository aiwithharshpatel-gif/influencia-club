import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { brandProtect } from '../middleware/auth.js';
import { sendPushNotification } from '../services/pushService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════════
// BRAND-SIDE MILESTONE ROUTES (brand auth)
// ═══════════════════════════════════════════════════════════════════

/**
 * Create milestones for a campaign-creator pairing
 * POST /api/milestones/brand/create
 * Body: { campaignCreatorId, milestones: [{ type, title, description?, dueDate? }] }
 */
router.post('/brand/create', brandProtect, async (req, res) => {
  try {
    const { campaignCreatorId, milestones } = req.body;

    if (!campaignCreatorId || !milestones?.length) {
      return res.status(400).json({
        success: false,
        message: 'campaignCreatorId and milestones array are required'
      });
    }

    // Verify ownership: campaign belongs to the brand
    const cc = await prisma.campaignCreator.findUnique({
      where: { id: campaignCreatorId },
      include: {
        campaign: {
          include: { brandInquiry: true }
        }
      }
    });

    if (!cc || cc.campaign.brandInquiry.email !== req.brand.email) {
      return res.status(404).json({
        success: false,
        message: 'Campaign creator pairing not found'
      });
    }

    // Create milestones in bulk
    const created = await prisma.$transaction(
      milestones.map((m, index) =>
        prisma.milestone.create({
          data: {
            campaignCreatorId,
            type: m.type,
            title: m.title,
            description: m.description || null,
            dueDate: m.dueDate ? new Date(m.dueDate) : null,
            sortOrder: index,
            status: index === 0 ? 'in_progress' : 'pending'
          }
        })
      )
    );

    res.json({
      success: true,
      message: `${created.length} milestones created`,
      milestones: created
    });
  } catch (error) {
    console.error('Create milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create milestones'
    });
  }
});

/**
 * Get milestones for a specific campaign-creator pairing (Brand View)
 * GET /api/milestones/brand/:campaignCreatorId
 */
router.get('/brand/:campaignCreatorId', brandProtect, async (req, res) => {
  try {
    const { campaignCreatorId } = req.params;

    const cc = await prisma.campaignCreator.findUnique({
      where: { id: campaignCreatorId },
      include: {
        campaign: {
          include: { brandInquiry: true }
        },
        creator: {
          select: {
            id: true,
            name: true,
            instagram: true,
            photoUrl: true,
            category: true
          }
        },
        milestones: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    if (!cc || cc.campaign.brandInquiry.email !== req.brand.email) {
      return res.status(404).json({
        success: false,
        message: 'Campaign creator pairing not found'
      });
    }

    res.json({
      success: true,
      campaignCreator: {
        id: cc.id,
        status: cc.status,
        deliverables: cc.deliverables,
        creator: cc.creator,
        campaign: {
          id: cc.campaign.id,
          title: cc.campaign.title,
          status: cc.campaign.status
        }
      },
      milestones: cc.milestones
    });
  } catch (error) {
    console.error('Fetch brand milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve milestones'
    });
  }
});

/**
 * Review a milestone submission (Brand approves or requests revision)
 * PUT /api/milestones/brand/:milestoneId/review
 * Body: { action: 'approve' | 'revision', feedback? }
 */
router.put('/brand/:milestoneId/review', brandProtect, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { action, feedback } = req.body;

    if (!['approve', 'revision'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be "approve" or "revision"'
      });
    }

    // Fetch milestone with ownership verification
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        campaignCreator: {
          include: {
            campaign: {
              include: { brandInquiry: true }
            },
            creator: true,
            milestones: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!milestone || milestone.campaignCreator.campaign.brandInquiry.email !== req.brand.email) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    if (milestone.status !== 'submitted') {
      return res.status(400).json({
        success: false,
        message: `Cannot review a milestone with status "${milestone.status}". It must be "submitted".`
      });
    }

    const newStatus = action === 'approve' ? 'approved' : 'revision_requested';

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: newStatus,
        brandFeedback: feedback || null,
        reviewedAt: new Date()
      }
    });

    // If approved, automatically advance the next milestone to "in_progress"
    if (action === 'approve') {
      const allMilestones = milestone.campaignCreator.milestones;
      const currentIndex = allMilestones.findIndex(m => m.id === milestoneId);
      const nextMilestone = allMilestones[currentIndex + 1];

      if (nextMilestone && nextMilestone.status === 'pending') {
        await prisma.milestone.update({
          where: { id: nextMilestone.id },
          data: { status: 'in_progress' }
        });
      }

      // If all milestones are now approved, mark CampaignCreator as completed
      const remainingPending = allMilestones.filter(
        m => m.id !== milestoneId && m.status !== 'approved'
      );
      // The "next" one we just set to in_progress counts as not approved
      if (remainingPending.length === 0 && !nextMilestone) {
        await prisma.campaignCreator.update({
          where: { id: milestone.campaignCreatorId },
          data: { status: 'completed' }
        });
      }
    }

    // Dispatch push notification to creator
    sendPushNotification(milestone.campaignCreator.creator.email, 'creator', {
      title: action === 'approve' ? 'Milestone Approved! 🚀' : 'Revision Requested ⚠️',
      body: action === 'approve'
        ? `Your milestone "${milestone.title}" has been approved.`
        : `Revision requested for "${milestone.title}". Feedback: "${feedback || ''}"`,
      data: {
        url: '/dashboard/milestones'
      }
    });

    res.json({
      success: true,
      message: `Milestone ${action === 'approve' ? 'approved' : 'sent back for revision'}`,
      milestone: updated
    });
  } catch (error) {
    console.error('Review milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to review milestone'
    });
  }
});

/**
 * Get all campaign-creator pairings with milestone progress for this brand
 * GET /api/milestones/brand
 */
router.get('/brand', brandProtect, async (req, res) => {
  try {
    // Get all campaigns belonging to this brand
    const inquiries = await prisma.brandInquiry.findMany({
      where: { email: req.brand.email },
      include: {
        campaigns: {
          include: {
            campaignCreators: {
              where: { status: { in: ['confirmed', 'completed'] } },
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    instagram: true,
                    photoUrl: true,
                    category: true
                  }
                },
                milestones: {
                  orderBy: { sortOrder: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    // Flatten into a list of collaborations with milestones
    const collaborations = [];
    for (const inq of inquiries) {
      for (const campaign of inq.campaigns) {
        for (const cc of campaign.campaignCreators) {
          const totalMs = cc.milestones.length;
          const approvedMs = cc.milestones.filter(m => m.status === 'approved').length;
          const pendingReview = cc.milestones.filter(m => m.status === 'submitted').length;

          collaborations.push({
            campaignCreatorId: cc.id,
            campaignId: campaign.id,
            brandInquiryId: inq.id,
            campaignTitle: campaign.title,
            brandName: inq.brandName,
            creator: cc.creator,
            status: cc.status,
            milestoneProgress: totalMs > 0 ? Math.round((approvedMs / totalMs) * 100) : 0,
            totalMilestones: totalMs,
            approvedMilestones: approvedMs,
            pendingReviewCount: pendingReview,
            milestones: cc.milestones
          });
        }
      }
    }

    res.json({
      success: true,
      collaborations
    });
  } catch (error) {
    console.error('Fetch brand collaborations milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve milestone data'
    });
  }
});


// ═══════════════════════════════════════════════════════════════════
// CREATOR-SIDE MILESTONE ROUTES (creator auth)
// ═══════════════════════════════════════════════════════════════════

/**
 * Get all milestones for the logged-in creator across all campaigns
 * GET /api/milestones/creator
 */
router.get('/creator', protect, async (req, res) => {
  try {
    const creatorId = req.user.id;

    const campaignCreators = await prisma.campaignCreator.findMany({
      where: {
        creatorId,
        status: { in: ['confirmed', 'completed'] }
      },
      include: {
        campaign: {
          include: {
            brandInquiry: {
              select: {
                brandName: true,
                email: true
              }
            }
          }
        },
        milestones: {
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const collaborations = campaignCreators.map(cc => {
      const totalMs = cc.milestones.length;
      const approvedMs = cc.milestones.filter(m => m.status === 'approved').length;

      return {
        campaignCreatorId: cc.id,
        campaignId: cc.campaign.id,
        campaignTitle: cc.campaign.title,
        brandName: cc.campaign.brandInquiry.brandName,
        status: cc.status,
        milestoneProgress: totalMs > 0 ? Math.round((approvedMs / totalMs) * 100) : 0,
        totalMilestones: totalMs,
        approvedMilestones: approvedMs,
        milestones: cc.milestones
      };
    });

    res.json({
      success: true,
      collaborations
    });
  } catch (error) {
    console.error('Fetch creator milestones error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve milestones'
    });
  }
});

/**
 * Submit a milestone deliverable (Creator submits URL/note)
 * PUT /api/milestones/creator/:milestoneId/submit
 * Body: { submissionUrl?, submissionNote? }
 */
router.put('/creator/:milestoneId/submit', protect, async (req, res) => {
  try {
    const { milestoneId } = req.params;
    const { submissionUrl, submissionNote } = req.body;
    const creatorId = req.user.id;

    if (!submissionUrl && !submissionNote) {
      return res.status(400).json({
        success: false,
        message: 'At least a submission URL or note is required'
      });
    }

    // Verify ownership
    const milestone = await prisma.milestone.findUnique({
      where: { id: milestoneId },
      include: {
        campaignCreator: {
          include: {
            campaign: {
              include: { brandInquiry: true }
            }
          }
        }
      }
    });

    if (!milestone || milestone.campaignCreator.creatorId !== creatorId) {
      return res.status(404).json({
        success: false,
        message: 'Milestone not found'
      });
    }

    if (!['in_progress', 'revision_requested'].includes(milestone.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit a milestone with status "${milestone.status}". Must be "in_progress" or "revision_requested".`
      });
    }

    const updated = await prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'submitted',
        submissionUrl: submissionUrl || milestone.submissionUrl,
        submissionNote: submissionNote || milestone.submissionNote,
        submittedAt: new Date()
      }
    });

    // Dispatch push notification to brand
    const brandEmail = milestone.campaignCreator.campaign.brandInquiry.email;
    sendPushNotification(brandEmail, 'brand', {
      title: 'New Milestone Submission 📁',
      body: `${req.user.name || 'Creator'} submitted work for "${milestone.title}".`,
      data: {
        url: '/brand/dashboard/milestones'
      }
    });

    res.json({
      success: true,
      message: 'Milestone submitted for review',
      milestone: updated
    });
  } catch (error) {
    console.error('Submit milestone error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit milestone'
    });
  }
});

export default router;
