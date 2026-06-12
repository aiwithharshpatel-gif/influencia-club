import express from 'express';
import { PrismaClient } from '@prisma/client';
import { brandProtect } from '../middleware/auth.js';
import { findMatchingCreators } from '../services/matchmakingService.js';

const router = express.Router();
const prisma = new PrismaClient();

// All brand routes require brandProtect middleware
router.use(brandProtect);

/**
 * Get Brand Inquiries
 * Fetches all past campaign inquiries submitted by the logged-in brand
 */
router.get('/inquiries', async (req, res) => {
  try {
    const inquiries = await prisma.brandInquiry.findMany({
      where: { email: req.brand.email },
      include: {
        campaigns: {
          include: {
            campaignCreators: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    instagram: true,
                    photoUrl: true,
                    followerCount: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate overall stats for the dashboard
    const totalCampaigns = inquiries.reduce((sum, inq) => sum + inq.campaigns.length, 0);
    const totalInvites = inquiries.reduce(
      (sum, inq) =>
        sum +
        inq.campaigns.reduce((cSum, camp) => cSum + camp.campaignCreators.length, 0),
      0
    );
    const confirmedCollabs = inquiries.reduce(
      (sum, inq) =>
        sum +
        inq.campaigns.reduce(
          (cSum, camp) =>
            cSum + camp.campaignCreators.filter(cc => cc.status === 'confirmed').length,
          0
        ),
      0
    );

    res.json({
      success: true,
      inquiries,
      stats: {
        totalInquiries: inquiries.length,
        totalCampaigns,
        totalInvites,
        confirmedCollabs
      }
    });
  } catch (error) {
    console.error('Fetch brand inquiries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign inquiries'
    });
  }
});

/**
 * Get AI matched creators for an inquiry
 */
router.get('/inquiries/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;

    const brandInquiry = await prisma.brandInquiry.findUnique({
      where: { id }
    });

    if (!brandInquiry || brandInquiry.email !== req.brand.email) {
      return res.status(404).json({
        success: false,
        message: 'Campaign inquiry not found'
      });
    }

    const matchResult = await findMatchingCreators(brandInquiry, 10);
    
    // Also fetch currently invited creators for this inquiry to flag them in UI
    const campaigns = await prisma.campaign.findMany({
      where: { brandInquiryId: id },
      include: {
        campaignCreators: true
      }
    });

    const invitedCreatorIds = new Set();
    const confirmedCreatorIds = new Set();

    campaigns.forEach(camp => {
      camp.campaignCreators.forEach(cc => {
        if (cc.status === 'confirmed' || cc.status === 'completed') {
          confirmedCreatorIds.add(cc.creatorId);
        } else {
          invitedCreatorIds.add(cc.creatorId);
        }
      });
    });

    if (matchResult.success) {
      const enhancedMatches = matchResult.matches.map(creator => {
        let inviteStatus = 'none';
        if (confirmedCreatorIds.has(creator.id)) {
          inviteStatus = 'confirmed';
        } else if (invitedCreatorIds.has(creator.id)) {
          inviteStatus = 'invited';
        }

        return {
          id: creator.id,
          name: creator.name,
          category: creator.category,
          city: creator.city,
          photoUrl: creator.photoUrl,
          followerCount: creator.followerCount,
          isVerified: creator.isVerified,
          isFeatured: creator.isFeatured,
          matchScore: creator.matchScore,
          matchPercentage: creator.matchPercentage,
          inviteStatus
        };
      });

      res.json({
        success: true,
        matches: enhancedMatches
      });
    } else {
      res.status(500).json({
        success: false,
        message: matchResult.error || 'Failed to calculate matches'
      });
    }
  } catch (error) {
    console.error('Fetch matchmaking results error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve creator matches'
    });
  }
});

/**
 * Invite a creator to collaborate
 */
router.post('/inquiries/:id/invite', async (req, res) => {
  try {
    const { id } = req.params;
    const { creatorId, deliverables } = req.body;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID is required'
      });
    }

    const brandInquiry = await prisma.brandInquiry.findUnique({
      where: { id }
    });

    if (!brandInquiry || brandInquiry.email !== req.brand.email) {
      return res.status(404).json({
        success: false,
        message: 'Campaign inquiry not found'
      });
    }

    // Find or create Campaign record
    let campaign = await prisma.campaign.findFirst({
      where: { brandInquiryId: id }
    });

    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          brandInquiryId: id,
          title: `Campaign for ${brandInquiry.brandName} (${brandInquiry.budgetRange})`,
          status: 'planning'
        }
      });
    }

    // Check if creator is already invited/added to this campaign
    const existingCc = await prisma.campaignCreator.findFirst({
      where: {
        campaignId: campaign.id,
        creatorId
      }
    });

    if (existingCc) {
      return res.status(400).json({
        success: false,
        message: `Creator is already ${existingCc.status} for this campaign`
      });
    }

    // Create CampaignCreator link
    const campaignCreator = await prisma.campaignCreator.create({
      data: {
        campaignId: campaign.id,
        creatorId,
        deliverables: deliverables || 'Deliverables to be negotiated',
        status: 'invited'
      }
    });

    res.json({
      success: true,
      message: 'Creator invited successfully to collaboration',
      campaignCreator
    });
  } catch (error) {
    console.error('Invite creator error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to invite creator'
    });
  }
});

export default router;
