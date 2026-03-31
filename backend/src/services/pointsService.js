import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const POINTS = {
  SIGNUP: 10,
  REFERRAL: 50,
  REFERRAL_MILESTONE: 100
};

export const creditPoints = async (creatorId, points, reason, note = null) => {
  return prisma.$transaction(async (tx) => {
    // Create points transaction
    await tx.pointsTransaction.create({
      data: {
        creatorId,
        type: 'earn',
        reason,
        points,
        note
      }
    });

    // Update creator balance
    const creator = await tx.creator.update({
      where: { id: creatorId },
      data: {
        pointsBalance: {
          increment: points
        }
      }
    });

    return creator;
  });
};

export const debitPoints = async (creatorId, points, reason, note = null) => {
  return prisma.$transaction(async (tx) => {
    const creator = await tx.creator.findUnique({
      where: { id: creatorId }
    });

    if (creator.pointsBalance < points) {
      throw new Error('Insufficient points');
    }

    // Create points transaction
    await tx.pointsTransaction.create({
      data: {
        creatorId,
        type: 'redeem',
        reason,
        points: -points,
        note
      }
    });

    // Update creator balance
    const updatedCreator = await tx.creator.update({
      where: { id: creatorId },
      data: {
        pointsBalance: {
          decrement: points
        }
      }
    });

    return updatedCreator;
  });
};

export const getPointsHistory = async (creatorId) => {
  return prisma.pointsTransaction.findMany({
    where: { creatorId },
    orderBy: { createdAt: 'desc' },
    take: 50
  });
};

export const processReferral = async (referrerId, referredId) => {
  return prisma.$transaction(async (tx) => {
    // Create referral record
    await tx.referral.create({
      data: {
        referrerId,
        referredId,
        status: 'confirmed'
      }
    });

    // Credit points to referrer
    const referrer = await tx.creator.findUnique({
      where: { id: referrerId }
    });

    if (referrer) {
      // Count total confirmed referrals
      const referralCount = await tx.referral.count({
        where: {
          referrerId,
          status: 'confirmed'
        }
      });

      // Base points for this referral
      await creditPointsToTransaction(tx, referrerId, POINTS.REFERRAL, 'referral', `Referred a new creator`);

      // Bonus for every 5th referral
      if (referralCount % 5 === 0) {
        await creditPointsToTransaction(tx, referrerId, POINTS.REFERRAL_MILESTONE, 'referral_milestone', `${referralCount} referrals milestone!`);
      }

      return referrer;
    }
  });
};

const creditPointsToTransaction = async (tx, creatorId, points, reason, note) => {
  await tx.pointsTransaction.create({
    data: {
      creatorId,
      type: 'earn',
      reason,
      points,
      note
    }
  });

  await tx.creator.update({
    where: { id: creatorId },
    data: {
      pointsBalance: { increment: points }
    }
  });
};

export const getReferralStats = async (creatorId) => {
  const referrals = await prisma.referral.findMany({
    where: { referrerId: creatorId },
    include: {
      referredUser: {
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const totalReferrals = await prisma.referral.count({
    where: { referrerId: creatorId, status: 'confirmed' }
  });

  const totalPointsEarned = await prisma.pointsTransaction.aggregate({
    where: {
      creatorId,
      reason: { in: ['referral', 'referral_milestone'] }
    },
    _sum: { points: true }
  });

  return {
    referrals,
    totalReferrals,
    totalPointsEarned: totalPointsEarned._sum.points || 0
  };
};
