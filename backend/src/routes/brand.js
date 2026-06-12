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

/**
 * Get Campaign Analytics
 */
router.get('/analytics', async (req, res) => {
  try {
    const inquiries = await prisma.brandInquiry.findMany({
      where: { email: req.brand.email },
      include: {
        campaigns: {
          include: {
            analytics: true,
            campaignCreators: {
              include: {
                creator: {
                  select: {
                    id: true,
                    name: true,
                    photoUrl: true,
                    category: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Flatten campaigns with analytics
    const campaignsWithAnalytics = [];
    let totalReach = 0;
    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let campaignsWithData = 0;
    let engagementSum = 0;

    for (const inq of inquiries) {
      for (const camp of inq.campaigns) {
        const analytics = camp.analytics;
        if (analytics) {
          campaignsWithData++;
          totalReach += analytics.totalReach;
          totalImpressions += analytics.totalImpressions;
          totalEngagement += analytics.totalEngagement;
          totalClicks += analytics.totalClicks;
          totalConversions += analytics.conversions;
          engagementSum += Number(analytics.engagementRate);
        }

        campaignsWithAnalytics.push({
          id: camp.id,
          title: camp.title,
          status: camp.status,
          brandName: inq.brandName,
          budgetRange: inq.budgetRange,
          startDate: camp.startDate,
          endDate: camp.endDate,
          creatorsCount: camp.campaignCreators.length,
          creators: camp.campaignCreators.map(cc => ({
            id: cc.creator.id,
            name: cc.creator.name,
            photoUrl: cc.creator.photoUrl,
            category: cc.creator.category,
            status: cc.status
          })),
          analytics: analytics ? {
            totalReach: analytics.totalReach,
            totalImpressions: analytics.totalImpressions,
            totalEngagement: analytics.totalEngagement,
            totalClicks: analytics.totalClicks,
            engagementRate: Number(analytics.engagementRate),
            ctr: Number(analytics.ctr),
            conversions: analytics.conversions,
            roi: Number(analytics.roi)
          } : null
        });
      }
    }

    res.json({
      success: true,
      campaigns: campaignsWithAnalytics,
      aggregated: {
        totalCampaigns: campaignsWithAnalytics.length,
        campaignsWithData,
        totalReach,
        totalImpressions,
        totalEngagement,
        totalClicks,
        totalConversions,
        avgEngagementRate: campaignsWithData > 0
          ? (engagementSum / campaignsWithData).toFixed(2)
          : '0.00'
      }
    });
  } catch (error) {
    console.error('Fetch analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve campaign analytics'
    });
  }
});

/**
 * Get all conversations for the brand
 */
router.get('/messages', async (req, res) => {
  try {
    // Get all messages where the brand is sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.brand.email, senderType: 'brand' },
          { recipientId: req.brand.email, recipientType: 'brand' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by creator (the other party)
    const conversationMap = new Map();
    for (const msg of messages) {
      const creatorId = msg.senderType === 'brand' ? msg.recipientId : msg.senderId;
      if (!conversationMap.has(creatorId)) {
        conversationMap.set(creatorId, {
          creatorId,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
          campaignId: msg.campaignId
        });
      }
      if (msg.recipientType === 'brand' && !msg.isRead) {
        const conv = conversationMap.get(creatorId);
        conv.unreadCount++;
      }
    }

    // Fetch creator details for each conversation
    const creatorIds = Array.from(conversationMap.keys());
    const creators = creatorIds.length > 0
      ? await prisma.creator.findMany({
          where: { id: { in: creatorIds } },
          select: {
            id: true,
            name: true,
            photoUrl: true,
            category: true,
            instagram: true
          }
        })
      : [];

    const creatorMap = new Map(creators.map(c => [c.id, c]));

    const conversations = Array.from(conversationMap.values()).map(conv => ({
      ...conv,
      creator: creatorMap.get(conv.creatorId) || { id: conv.creatorId, name: 'Unknown Creator' }
    }));

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Fetch conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations'
    });
  }
});

/**
 * Get message thread with a specific creator
 */
router.get('/messages/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.brand.email, senderType: 'brand', recipientId: creatorId },
          { senderId: creatorId, senderType: 'creator', recipientId: req.brand.email }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        senderId: creatorId,
        senderType: 'creator',
        recipientId: req.brand.email,
        recipientType: 'brand',
        isRead: false
      },
      data: { isRead: true }
    });

    // Fetch creator info
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        name: true,
        photoUrl: true,
        category: true,
        instagram: true
      }
    });

    res.json({
      success: true,
      messages,
      creator: creator || { id: creatorId, name: 'Unknown Creator' }
    });
  } catch (error) {
    console.error('Fetch message thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages'
    });
  }
});

/**
 * Send a message to a creator
 */
router.post('/messages', async (req, res) => {
  try {
    const { creatorId, content, campaignId } = req.body;

    if (!creatorId || !content?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID and message content are required'
      });
    }

    // Verify the creator exists
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId: req.brand.email,
        senderType: 'brand',
        recipientId: creatorId,
        recipientType: 'creator',
        content: content.trim(),
        campaignId: campaignId || null
      }
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

export default router;
