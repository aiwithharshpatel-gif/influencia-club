import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanupTestData() {
  console.log('🧹 [Cleanup Service] Checking for test profiles and test data in database...');
  try {
    // Find all test creators
    const testCreators = await prisma.creator.findMany({
      where: {
        OR: [
          { email: { contains: 'example.com' } },
          { email: { contains: 'testcreator_' } },
          { email: { contains: 'theme_creator_test_' } },
          { email: { contains: 'sso_ig_test_' } },
          { instagram: { startsWith: 'theme_insta_' } },
          { instagram: { startsWith: 'ig_sso_creator_' } },
          { instagram: { startsWith: 'test_ig_' } },
          { instagram: 'aria.sen.lifestyle' }
        ]
      }
    });

    console.log(`🧹 [Cleanup Service] Found ${testCreators.length} test creator(s) to remove.`);

    for (const creator of testCreators) {
      console.log(`🗑️ Removing test creator: ${creator.name} (${creator.email}, @${creator.instagram})`);
      const id = creator.id;

      // 1. Delete OTPs
      await prisma.otpVerification.deleteMany({
        where: { email: creator.email }
      });

      // 2. Delete points transactions
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

      // 5. Delete milestones & campaign creators
      const campaignCreators = await prisma.campaignCreator.findMany({
        where: { creatorId: id }
      });

      for (const cc of campaignCreators) {
        await prisma.milestone.deleteMany({
          where: { campaignCreatorId: cc.id }
        });
      }

      await prisma.campaignCreator.deleteMany({
        where: { creatorId: id }
      });

      // 6. Delete campaign applications
      await prisma.campaignApplication.deleteMany({
        where: { creatorId: id }
      });

      // 7. Delete payments & payouts
      await prisma.payment.deleteMany({
        where: { creatorId: id }
      });
      await prisma.payout.deleteMany({
        where: { creatorId: id }
      });

      // 8. Delete analytics
      await prisma.creatorAnalytics.deleteMany({
        where: { creatorId: id }
      });

      // 9. Delete notifications
      await prisma.notification.deleteMany({
        where: { recipientId: id }
      });

      // 10. Delete messages
      await prisma.message.deleteMany({
        where: {
          OR: [
            { senderId: id },
            { recipientId: id }
          ]
        }
      });

      // 11. Delete instagram profile
      await prisma.instagramProfile.deleteMany({
        where: { creatorId: id }
      });

      // 12. Unlink any assigned inquiries
      await prisma.brandInquiry.updateMany({
        where: { assignedTo: id },
        data: { assignedTo: null }
      });

      // 13. Delete creator
      await prisma.creator.delete({
        where: { id }
      });
    }

    // Also remove test inquiries
    const testInquiries = await prisma.brandInquiry.findMany({
      where: {
        OR: [
          { email: { contains: 'example.com' } },
          { email: { contains: 'testbrand_' } }
        ]
      },
      include: {
        campaigns: {
          include: {
            campaignCreators: true
          }
        }
      }
    });

    console.log(`🧹 [Cleanup Service] Found ${testInquiries.length} test brand inquiry(ies) to remove.`);

    for (const inq of testInquiries) {
      for (const camp of inq.campaigns) {
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

      await prisma.campaign.deleteMany({
        where: { brandInquiryId: inq.id }
      });
      await prisma.payment.deleteMany({
        where: { brandInquiryId: inq.id }
      });
      await prisma.brandInquiry.delete({
        where: { id: inq.id }
      });
    }

    console.log('✅ [Cleanup Service] All test profiles and test data successfully cleaned up.');

    // Ensure all existing creators have valid photos (Instagram or branded avatar fallback)
    await syncCreatorPhotos();
  } catch (error) {
    console.error('❌ [Cleanup Service] Error during test data cleanup:', error);
  }
}

export async function syncCreatorPhotos() {
  try {
    const creators = await prisma.creator.findMany({
      include: { instagramProfile: true }
    });

    for (const creator of creators) {
      const current = creator.photoUrl?.trim();
      if (!current || current.length === 0) {
        let target = creator.instagramProfile?.profilePicUrl?.trim();
        if (!target) {
          target = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=111&color=D4AF37&size=400`;
        }
        await prisma.creator.update({
          where: { id: creator.id },
          data: { photoUrl: target }
        });
      }
    }
  } catch (err) {
    console.error('Error syncing creator photos:', err);
  }
}

// If run directly
if (process.argv[1]?.endsWith('clean_test_data.js')) {
  cleanupTestData().then(() => {
    prisma.$disconnect();
  });
}

