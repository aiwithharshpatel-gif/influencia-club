import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { getPointsHistory, getReferralStats } from '../services/pointsService.js';
import { sendPushNotification } from '../services/pushService.js';
import { upload, uploadToCloudinary } from '../services/uploadService.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(protect);

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id },
      include: {
        instagramProfile: {
          select: { profilePicUrl: true, username: true }
        }
      }
    });

    if (!creator) {
      return res.status(404).json({ success: false, message: 'Creator not found' });
    }

    // Auto-resolve effective photo URL
    const effectivePhotoUrl = (creator.photoUrl && creator.photoUrl.trim().length > 0)
      ? creator.photoUrl.trim()
      : (creator.instagramProfile?.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=111&color=D4AF37&size=400`);

    // Self-heal creator.photoUrl in db if currently empty
    if ((!creator.photoUrl || creator.photoUrl.trim().length === 0) && effectivePhotoUrl) {
      prisma.creator.update({
        where: { id: creator.id },
        data: { photoUrl: effectivePhotoUrl }
      }).catch(err => console.error('Auto-heal creator photoUrl error:', err));
    }

    creator.photoUrl = effectivePhotoUrl;

    // Get referral count
    const referralCount = await prisma.referral.count({
      where: { referrerId: req.user.id, status: 'confirmed' }
    });

    // Get active collabs count
    const activeCollabs = await prisma.campaignCreator.count({
      where: {
        creatorId: req.user.id,
        status: { in: ['invited', 'confirmed'] }
      }
    });

    // Calculate profile completion
    let completion = 0;
    if (creator.photoUrl) completion += 20;
    if (creator.bio) completion += 20;
    if (creator.followerCount) completion += 20;
    if (creator.isVerified) completion += 20;
    completion += 20; // Base for having basic info

    res.json({
      success: true,
      data: {
        creator,
        referralCount,
        activeCollabs,
        profileCompletion: completion
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get points balance and history
router.get('/points', async (req, res) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id },
      select: {
        pointsBalance: true
      }
    });

    const history = await getPointsHistory(req.user.id);

    res.json({
      success: true,
      data: {
        balance: creator.pointsBalance,
        history
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get referrals
router.get('/referrals', async (req, res) => {
  try {
    const stats = await getReferralStats(req.user.id);

    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id },
      select: {
        referralCode: true
      }
    });

    res.json({
      success: true,
      data: {
        referralCode: creator.referralCode,
        ...stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get collab history
router.get('/collabs', async (req, res) => {
  try {
    const collabs = await prisma.campaignCreator.findMany({
      where: { creatorId: req.user.id },
      include: {
        campaign: {
          include: {
            brandInquiry: {
              select: {
                brandName: true,
                packageType: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      collabs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Submit redemption request
router.post('/redeem', async (req, res) => {
  try {
    const { rewardType, pointsCost } = req.body;

    const creator = await prisma.creator.findUnique({
      where: { id: req.user.id }
    });

    if (creator.pointsBalance < pointsCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    const redemption = await prisma.redemptionRequest.create({
      data: {
        creatorId: req.user.id,
        rewardType,
        pointsCost
      }
    });

    res.json({
      success: true,
      message: 'Redemption request submitted',
      redemption
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

import { z } from 'zod';

const profileUpdateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  category: z.string().optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  mobile: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  followerCount: z.string().optional().nullable()
});

// Upload profile photo handler
const handleProfilePhotoUpload = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No photo uploaded. Please select an image file.'
      });
    }

    const uploadResult = await uploadToCloudinary(
      file.buffer,
      'influenzia-creators',
      'image',
      file.mimetype
    );

    const updatedCreator = await prisma.creator.update({
      where: { id: req.user.id },
      data: { photoUrl: uploadResult.url },
      select: {
        id: true,
        name: true,
        email: true,
        photoUrl: true,
        instagram: true
      }
    });

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      photoUrl: uploadResult.url,
      creator: updatedCreator
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload profile photo'
    });
  }
};

router.post('/profile/photo', upload.single('photo'), handleProfilePhotoUpload);
router.put('/profile/photo', upload.single('photo'), handleProfilePhotoUpload);

// Update profile
router.put('/profile', async (req, res) => {
  try {
    const validated = profileUpdateSchema.parse(req.body);
    
    const updateData = {};
    if (validated.name !== undefined && validated.name !== null) updateData.name = validated.name;
    if (validated.bio !== undefined) updateData.bio = validated.bio;
    if (validated.city !== undefined) updateData.city = validated.city;
    if (validated.category !== undefined && validated.category !== null) updateData.category = validated.category;
    if (validated.instagram !== undefined && validated.instagram !== null) {
      updateData.instagram = validated.instagram.replace(/^@/, '').trim().toLowerCase();
    }
    if (validated.mobile !== undefined && validated.mobile !== null) updateData.mobile = validated.mobile;
    if (validated.photoUrl !== undefined) {
      if (typeof validated.photoUrl === 'string' && validated.photoUrl.trim().length > 0) {
        updateData.photoUrl = validated.photoUrl.trim();
      } else {
        const ig = await prisma.instagramProfile.findUnique({
          where: { creatorId: req.user.id },
          select: { profilePicUrl: true }
        });
        updateData.photoUrl = ig?.profilePicUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(validated.name || 'Creator')}&background=111&color=D4AF37&size=400`;
      }
    }
    if (validated.followerCount !== undefined) updateData.followerCount = validated.followerCount;

    const creator = await prisma.creator.update({
      where: { id: req.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        instagram: true,
        category: true,
        city: true,
        bio: true,
        photoUrl: true,
        mobile: true,
        followerCount: true,
        pointsBalance: true,
        tier: true,
        isVerified: true,
        isFeatured: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      creator
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Accept a collaboration invitation
router.put('/collabs/:id/accept', async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;

    const collab = await prisma.campaignCreator.findUnique({
      where: { id },
      include: {
        campaign: {
          include: { brandInquiry: true }
        }
      }
    });

    if (!collab || collab.creatorId !== creatorId) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    const updated = await prisma.campaignCreator.update({
      where: { id },
      data: { status: 'confirmed' }
    });

    // Create default milestones if none exist yet
    const existingMilestones = await prisma.milestone.count({
      where: { campaignCreatorId: id }
    });

    if (existingMilestones === 0) {
      const defaultMilestones = [
        { type: 'brief_review', title: '1. Script & Concept Approval', description: 'Submit content concept and script outline for brand review', sortOrder: 0, status: 'in_progress' },
        { type: 'draft_submit', title: '2. Draft Content Review', description: 'Upload draft video / photos for review and feedback', sortOrder: 1, status: 'pending' },
        { type: 'live_verification', title: '3. Final Live Post & Metrics', description: 'Publish final content and provide link / performance metrics', sortOrder: 2, status: 'pending' }
      ];

      for (const m of defaultMilestones) {
        await prisma.milestone.create({
          data: {
            campaignCreatorId: id,
            ...m
          }
        });
      }
    }

    res.json({
      success: true,
      message: 'Collaboration accepted successfully!',
      collab: updated
    });
  } catch (error) {
    console.error('Accept collab error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to accept collaboration'
    });
  }
});

// Decline a collaboration invitation
router.put('/collabs/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;

    const collab = await prisma.campaignCreator.findUnique({
      where: { id }
    });

    if (!collab || collab.creatorId !== creatorId) {
      return res.status(404).json({
        success: false,
        message: 'Collaboration not found'
      });
    }

    const updated = await prisma.campaignCreator.update({
      where: { id },
      data: { status: 'declined' }
    });

    res.json({
      success: true,
      message: 'Collaboration declined',
      collab: updated
    });
  } catch (error) {
    console.error('Decline collab error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline collaboration'
    });
  }
});

/**
 * Get all conversations for the logged-in creator
 * GET /api/dashboard/messages
 */
router.get('/messages', async (req, res) => {
  try {
    const creatorId = req.user.id;

    // Get all messages involving this creator
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: creatorId, senderType: 'creator' },
          { recipientId: creatorId, recipientType: 'creator' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group by brand (the other party's email)
    const conversationMap = new Map();
    for (const msg of messages) {
      const brandEmail = msg.senderType === 'creator' ? msg.recipientId : msg.senderId;
      if (!conversationMap.has(brandEmail)) {
        conversationMap.set(brandEmail, {
          brandEmail,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt,
          unreadCount: 0,
          campaignId: msg.campaignId
        });
      }
      if (msg.recipientType === 'creator' && !msg.isRead) {
        const conv = conversationMap.get(brandEmail);
        conv.unreadCount++;
      }
    }

    // Fetch brand details (BrandInquiry brandName) for each conversation
    const brandEmails = Array.from(conversationMap.keys());
    const brandInquiries = brandEmails.length > 0
      ? await prisma.brandInquiry.findMany({
          where: { email: { in: brandEmails } },
          select: {
            brandName: true,
            email: true
          }
        })
      : [];

    const brandMap = new Map(brandInquiries.map(b => [b.email, b]));

    const conversations = Array.from(conversationMap.values()).map(conv => ({
      ...conv,
      brand: brandMap.get(conv.brandEmail) || { email: conv.brandEmail, brandName: 'Unknown Brand' }
    }));

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    console.error('Fetch creator conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve conversations'
    });
  }
});

/**
 * Get message thread with a specific brand
 * GET /api/dashboard/messages/:brandEmail
 */
router.get('/messages/:brandEmail', async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { brandEmail } = req.params;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: creatorId, senderType: 'creator', recipientId: brandEmail },
          { senderId: brandEmail, senderType: 'brand', recipientId: creatorId }
        ]
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        senderId: brandEmail,
        senderType: 'brand',
        recipientId: creatorId,
        recipientType: 'creator',
        isRead: false
      },
      data: { isRead: true }
    });

    // Fetch brand info
    const brandInquiry = await prisma.brandInquiry.findFirst({
      where: { email: brandEmail },
      select: {
        brandName: true,
        email: true
      }
    });

    res.json({
      success: true,
      messages,
      brand: brandInquiry || { email: brandEmail, brandName: 'Unknown Brand' }
    });
  } catch (error) {
    console.error('Fetch creator message thread error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve messages'
    });
  }
});

/**
 * Send a message to a brand
 * POST /api/dashboard/messages
 */
router.post('/messages', async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { brandEmail, content, campaignId, attachments } = req.body;

    if (!brandEmail || (!content?.trim() && (!attachments || attachments.length === 0))) {
      return res.status(400).json({
        success: false,
        message: 'Brand Email and message content or attachments are required'
      });
    }

    const message = await prisma.message.create({
      data: {
        senderId: creatorId,
        senderType: 'creator',
        recipientId: brandEmail,
        recipientType: 'brand',
        content: content?.trim() || '',
        campaignId: campaignId || null,
        attachments: attachments || undefined
      }
    });

    // Emit real-time socket event to the recipient brand
    const io = req.app.get('io');
    if (io) {
      io.to(brandEmail).emit('message', message);
    }

    // Dispatch push notification to brand
    sendPushNotification(brandEmail, 'brand', {
      title: `New Message from ${req.user.name || 'Creator'}`,
      body: attachments?.length ? '📎 Sent an attachment' : content.trim(),
      data: {
        url: '/brand/dashboard/messages'
      }
    });

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Creator send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

/**
 * Upload a file attachment for chat
 * POST /api/dashboard/messages/upload
 * Multipart form: file (max 5MB)
 */
router.post('/messages/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const result = await uploadToCloudinary(
      req.file.buffer,
      'influenzia-chat',
      isImage ? 'image' : 'raw'
    );

    res.json({
      success: true,
      attachment: {
        url: result.url,
        type: isImage ? 'image' : 'file',
        name: req.file.originalname,
        size: result.bytes,
        format: result.format,
        width: result.width || null,
        height: result.height || null
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file'
    });
  }
});

/**
 * Explore Public Campaigns (Open briefs)
 * GET /api/dashboard/campaigns/explore
 */
router.get('/campaigns/explore', async (req, res) => {
  try {
    const creatorId = req.user.id;

    // Fetch all public campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        isPublic: true,
        status: 'planning' // only show active planning campaigns
      },
      include: {
        brandInquiry: {
          select: {
            brandName: true,
            email: true
          }
        },
        campaignApplications: {
          where: { creatorId }
        },
        campaignCreators: {
          where: { creatorId }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format output
    const formatted = campaigns.map(camp => {
      const application = camp.campaignApplications[0] || null;
      const collab = camp.campaignCreators[0] || null;

      return {
        id: camp.id,
        title: camp.title,
        budget: camp.budget,
        notes: camp.notes,
        startDate: camp.startDate,
        endDate: camp.endDate,
        brandName: camp.brandInquiry.brandName,
        brandEmail: camp.brandInquiry.email,
        createdAt: camp.createdAt,
        applicationStatus: application ? application.status : null,
        collabStatus: collab ? collab.status : null,
        alreadyApplied: !!application,
        isMatched: collab ? collab.status === 'confirmed' : false
      };
    });

    res.json({
      success: true,
      campaigns: formatted
    });
  } catch (error) {
    console.error('Explore campaigns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public campaigns'
    });
  }
});

/**
 * Apply to a public campaign
 * POST /api/dashboard/campaigns/:id/apply
 */
router.post('/campaigns/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const { pitch, rate } = req.body;
    const creatorId = req.user.id;

    if (!pitch?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Pitch statement is required'
      });
    }

    // Verify campaign exists and is public
    const campaign = await prisma.campaign.findUnique({
      where: { id }
    });

    if (!campaign || !campaign.isPublic) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found or is not accepting public applications'
      });
    }

    // Check if creator has already applied
    const existingApp = await prisma.campaignApplication.findFirst({
      where: {
        campaignId: id,
        creatorId
      }
    });

    if (existingApp) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this campaign'
      });
    }

    // Create application
    const application = await prisma.campaignApplication.create({
      data: {
        campaignId: id,
        creatorId,
        pitch: pitch.trim(),
        rate: rate ? rate.trim() : 'Negotiable',
        status: 'pending'
      }
    });

    res.json({
      success: true,
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    console.error('Apply to campaign error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application'
    });
  }
});

/**
 * Get the creator's submitted applications
 * GET /api/dashboard/campaigns/applications
 */
router.get('/campaigns/applications', async (req, res) => {
  try {
    const creatorId = req.user.id;

    const applications = await prisma.campaignApplication.findMany({
      where: { creatorId },
      include: {
        campaign: {
          include: {
            brandInquiry: {
              select: {
                brandName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = applications.map(app => ({
      id: app.id,
      pitch: app.pitch,
      rate: app.rate,
      status: app.status,
      createdAt: app.createdAt,
      campaign: {
        id: app.campaign.id,
        title: app.campaign.title,
        budget: app.campaign.budget,
        brandName: app.campaign.brandInquiry.brandName
      }
    }));

    res.json({
      success: true,
      applications: formatted
    });
  } catch (error) {
    console.error('Fetch submitted applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications'
    });
  }
});

export default router;
