import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AI-Powered Matchmaking Service
 * Matches brands with suitable creators based on multiple factors
 */

export const findMatchingCreators = async (brandInquiry, limit = 10, customWeights = {}) => {
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
        creatorAnalytics: true,
        instagramProfile: true,
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
      const { score, breakdown } = calculateMatchScore(creator, budgetToFollowerRange, brandInquiry, customWeights);
      return { ...creator, matchScore: score, matchBreakdown: breakdown };
    });

    // Sort by match score and return top matches
    const sortedCreators = scoredCreators
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit)
      .map(({ matchScore, matchBreakdown, ...creator }) => ({
        ...creator,
        matchScore: Math.round(matchScore),
        matchPercentage: `${Math.round(matchScore)}%`,
        matchBreakdown
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

const RELATED_CATEGORIES = {
  influencer: ['creator', 'public_figure'],
  creator: ['influencer', 'public_figure'],
  model: ['actor', 'public_figure'],
  actor: ['model', 'public_figure'],
  public_figure: ['influencer', 'creator', 'model', 'actor']
};

/**
 * Calculate follower match score ratio (0 to 1)
 */
const getFollowerMatchRatio = (followerCount, budgetRange) => {
  if (!followerCount) return 0;
  const followers = parseFollowerCount(followerCount);
  const ranges = {
    '<5000': { min: 0, max: 5000 },
    '5000-15000': { min: 5000, max: 15000 },
    '15000-30000': { min: 15000, max: 30000 },
    '30000-50000': { min: 30000, max: 50000 },
    '50000+': { min: 50000, max: Infinity }
  };
  const targetRange = ranges[budgetRange];
  if (!targetRange) return 0.5;

  if (followers >= targetRange.min && followers <= targetRange.max) {
    return 1.0; // Perfect match
  } else if (followers >= targetRange.min * 0.8 && followers <= targetRange.max * 1.2) {
    return 0.75; // Close match
  }
  return 0.25; // Partial match
};

/**
 * Calculate performance ratio (0 to 1)
 */
const getPerformanceRatio = (creator) => {
  if (!creator.campaignCreators || creator.campaignCreators.length === 0) {
    return 0.33; // No history, default lower score
  }
  const completedCampaigns = creator.campaignCreators.length;
  if (completedCampaigns >= 10) return 1.0;
  if (completedCampaigns >= 5) return 0.8;
  if (completedCampaigns >= 2) return 0.67;
  return 0.53;
};

/**
 * Calculate match score for a creator with dynamic weights (0-100)
 */
const calculateMatchScore = (creator, budgetRange, brandInquiry, weights = {}) => {
  const {
    wCategory = 30,
    wLocation = 15,
    wFollowers = 20,
    wPerformance = 15,
    wEngagement = 10,
    wVerification = 10,
    wFeatured = 5,
    wResponseTime = 5,
    wSuccessRate = 10
  } = weights;

  const totalPossible = Number(wCategory) + Number(wLocation) + Number(wFollowers) + 
                       Number(wPerformance) + Number(wEngagement) + Number(wVerification) + 
                       Number(wFeatured) + Number(wResponseTime) + Number(wSuccessRate);

  let categoryPoints = 0;
  let locationPoints = 0;
  let followerPoints = 0;
  let performancePoints = 0;
  let engagementPoints = 0;
  let verificationPoints = 0;
  let featuredPoints = 0;
  let responseTimePoints = 0;
  let successRatePoints = 0;

  // 1. Category Match
  const isDirectCategoryMatch = brandInquiry.categories.includes(creator.category);
  if (isDirectCategoryMatch) {
    categoryPoints = Number(wCategory);
  } else {
    const related = RELATED_CATEGORIES[creator.category] || [];
    const isRelatedMatch = brandInquiry.categories.some(cat => related.includes(cat));
    if (isRelatedMatch) {
      categoryPoints = Math.round(Number(wCategory) * 0.5);
    }
  }

  // 2. Location Match
  if (brandInquiry.city && brandInquiry.city === creator.city) {
    locationPoints = Number(wLocation);
  } else if (creator.city === 'Ahmedabad') {
    locationPoints = Math.round(Number(wLocation) * 0.53);
  }

  // 3. Follower Match
  const followerRatio = getFollowerMatchRatio(creator.followerCount, budgetRange);
  followerPoints = Math.round(followerRatio * Number(wFollowers));

  // 4. Past Performance
  const performanceRatio = getPerformanceRatio(creator);
  performancePoints = Math.round(performanceRatio * Number(wPerformance));

  // 5. Engagement Rate
  if (creator.instagramProfile?.engagementRate) {
    const er = parseFloat(creator.instagramProfile.engagementRate);
    let erRatio = 0.1;
    if (er >= 5.0) erRatio = 1.0;
    else if (er >= 3.0) erRatio = 0.7;
    else if (er >= 1.0) erRatio = 0.4;
    engagementPoints = Math.round(erRatio * Number(wEngagement));
  }

  // 6. Verification Status
  if (creator.isVerified) {
    verificationPoints = Number(wVerification);
  }

  // 7. Featured Status
  if (creator.isFeatured) {
    featuredPoints = Number(wFeatured);
  }

  // 8. Response Time
  if (creator.creatorAnalytics && creator.creatorAnalytics.responseTime < 24) {
    responseTimePoints = Number(wResponseTime);
  }

  // 9. Success Rate
  if (creator.creatorAnalytics?.successRate) {
    const sr = parseFloat(creator.creatorAnalytics.successRate);
    let srRatio = 0.1;
    if (sr >= 90.0) srRatio = 1.0;
    else if (sr >= 75.0) srRatio = 0.7;
    successRatePoints = Math.round(srRatio * Number(wSuccessRate));
  }

  const rawScore = categoryPoints + locationPoints + followerPoints + performancePoints + 
                   engagementPoints + verificationPoints + featuredPoints + responseTimePoints + 
                   successRatePoints;

  const scorePercentage = totalPossible > 0 ? Math.min(100, Math.round((rawScore / totalPossible) * 100)) : 0;

  return {
    score: scorePercentage,
    breakdown: {
      category: { points: categoryPoints, max: Number(wCategory) },
      location: { points: locationPoints, max: Number(wLocation) },
      followers: { points: followerPoints, max: Number(wFollowers) },
      performance: { points: performancePoints, max: Number(wPerformance) },
      engagement: { points: engagementPoints, max: Number(wEngagement) },
      verification: { points: verificationPoints, max: Number(wVerification) },
      featured: { points: featuredPoints, max: Number(wFeatured) },
      responseTime: { points: responseTimePoints, max: Number(wResponseTime) },
      successRate: { points: successRatePoints, max: Number(wSuccessRate) }
    }
  };
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
