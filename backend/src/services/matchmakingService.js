import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AI-Powered Matchmaking Service
 * Matches brands with suitable creators based on multiple factors
 */

export const findMatchingCreators = async (brandInquiry, limit = 10) => {
  try {
    const { categories, budgetRange, city } = brandInquiry;

    // Parse categories
    const categoryList = typeof categories === 'string' 
      ? JSON.parse(categories) 
      : categories;

    // Budget to follower range mapping
    const budgetToFollowerRange = getFollowerRangeForBudget(budgetRange);

    // Build search criteria
    const where = {
      isApproved: true,
      isVerified: true,
      status: 'active',
      category: {
        in: categoryList
      }
    };

    // Add city preference if specified
    if (city && city !== 'all') {
      where.city = city;
    }

    // Get potential creators
    const creators = await prisma.creator.findMany({
      where,
      include: {
        analytics: true,
        campaignCreators: {
          where: { status: 'completed' },
          include: {
            campaign: {
              include: {
                brandInquiry: {
                  select: { budgetRange: true }
                }
              }
            }
          }
        }
      }
    });

    // Score each creator
    const scoredCreators = creators.map(creator => {
      const score = calculateMatchScore(creator, budgetToFollowerRange, brandInquiry);
      return { ...creator, matchScore: score };
    });

    // Sort by match score and return top matches
    const sortedCreators = scoredCreators
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore, ...creator }) => ({
        ...creator,
        matchScore: Math.round(matchScore),
        matchPercentage: `${Math.round(matchScore)}%`
      }));

    return {
      success: true,
      matches: sortedCreators,
      totalMatches: sortedCreators.length
    };
  } catch (error) {
    console.error('Matchmaking error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Calculate match score for a creator
 * Score is based on multiple factors (0-100)
 */
const calculateMatchScore = (creator, budgetRange, brandInquiry) => {
  let score = 0;

  // 1. Category Match (30 points)
  if (brandInquiry.categories.includes(creator.category)) {
    score += 30;
  }

  // 2. Location Match (15 points)
  if (brandInquiry.city && brandInquiry.city === creator.city) {
    score += 15;
  } else if (creator.city === 'Ahmedabad') {
    // Prefer Ahmedabad creators (HQ advantage)
    score += 8;
  }

  // 3. Follower Range Match (20 points)
  const followerScore = calculateFollowerMatch(creator.followerCount, budgetRange);
  score += followerScore;

  // 4. Verification Status (10 points)
  if (creator.isVerified) {
    score += 10;
  }

  // 5. Featured Status (5 points)
  if (creator.isFeatured) {
    score += 5;
  }

  // 6. Past Performance (15 points)
  const performanceScore = calculatePerformanceScore(creator);
  score += performanceScore;

  // 7. Response Time (5 points)
  if (creator.analytics && creator.analytics.responseTime < 24) {
    score += 5;
  }

  return Math.min(score, 100); // Cap at 100
};

/**
 * Calculate follower match score
 */
const calculateFollowerMatch = (followerCount, budgetRange) => {
  if (!followerCount) return 0;

  // Parse follower count (e.g., "50K+", "1.2L+")
  const followers = parseFollowerCount(followerCount);
  
  const ranges = {
    '<5000': { min: 0, max: 5000 },
    '5000-15000': { min: 5000, max: 15000 },
    '15000-30000': { min: 15000, max: 30000 },
    '30000-50000': { min: 30000, max: 50000 },
    '50000+': { min: 50000, max: Infinity }
  };

  const targetRange = ranges[budgetRange];
  if (!targetRange) return 10;

  if (followers >= targetRange.min && followers <= targetRange.max) {
    return 20; // Perfect match
  } else if (followers >= targetRange.min * 0.8 && followers <= targetRange.max * 1.2) {
    return 15; // Close match
  }
  
  return 5; // Partial match
};

/**
 * Calculate performance score based on past collaborations
 */
const calculatePerformanceScore = (creator) => {
  if (!creator.campaignCreators || creator.campaignCreators.length === 0) {
    return 5; // No history, neutral score
  }

  const completedCampaigns = creator.campaignCreators.length;
  
  // More campaigns = more experience
  if (completedCampaigns >= 10) return 15;
  if (completedCampaigns >= 5) return 12;
  if (completedCampaigns >= 2) return 10;
  
  return 8;
};

/**
 * Parse follower count string to number
 */
const parseFollowerCount = (countStr) => {
  if (!countStr) return 0;
  
  const str = countStr.replace(/[^0-9.KLM+]/g, '').toUpperCase();
  
  if (str.includes('M')) {
    return parseFloat(str) * 1000000;
  } else if (str.includes('L')) {
    return parseFloat(str) * 100000;
  } else if (str.includes('K')) {
    return parseFloat(str) * 1000;
  }
  
  return parseFloat(str) || 0;
};

/**
 * Get follower range for budget
 */
const getFollowerRangeForBudget = (budgetRange) => {
  const mapping = {
    '<5000': '5000-15000',
    '5000-15000': '5000-15000',
    '15000-30000': '15000-30000',
    '30000-50000': '30000-50000',
    '50000+': '50000+'
  };
  return mapping[budgetRange] || '5000-15000';
};

/**
 * Get AI-powered creator recommendations
 */
export const getRecommendations = async (creatorId, limit = 5) => {
  try {
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId },
      include: {
        campaignCreators: {
          include: {
            campaign: {
              include: {
                campaignCreators: {
                  include: {
                    creator: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!creator) {
      return { success: false, error: 'Creator not found' };
    }

    // Find creators who worked on similar campaigns
    const similarCreators = new Map();

    creator.campaignCreators.forEach(cc => {
      cc.campaign.campaignCreators.forEach(otherCc => {
        if (otherCc.creatorId !== creatorId) {
          const count = similarCreators.get(otherCc.creatorId) || 0;
          similarCreators.set(otherCc.creatorId, count + 1);
        }
      });
    });

    // Sort by collaboration frequency
    const sorted = Array.from(similarCreators.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, count]) => ({ creatorId: id, collaborationCount: count }));

    // Get creator details
    const recommendations = await Promise.all(
      sorted.map(async item => {
        const c = await prisma.creator.findUnique({
          where: { id: item.creatorId },
          select: {
            id: true,
            name: true,
            photoUrl: true,
            category: true,
            city: true,
            followerCount: true,
            isVerified: true,
            isFeatured: true
          }
        });
        return { ...c, commonCampaigns: item.collaborationCount };
      })
    );

    return {
      success: true,
      recommendations
    };
  } catch (error) {
    console.error('Recommendation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Calculate estimated campaign reach
 */
export const estimateCampaignReach = (creatorIds) => {
  try {
    // This would ideally use actual engagement data
    // For now, use follower count as proxy
    
    const totalFollowers = creatorIds.reduce((sum, id) => {
      // Would fetch actual follower count in production
      return sum + 50000; // Average estimate
    }, 0);

    // Assume 20% average reach
    const estimatedReach = Math.round(totalFollowers * 0.2);
    const estimatedImpressions = Math.round(estimatedReach * 1.5);

    return {
      success: true,
      data: {
        totalFollowers,
        estimatedReach,
        estimatedImpressions,
        avgEngagementRate: 3.5 // Industry average
      }
    };
  } catch (error) {
    console.error('Estimation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
