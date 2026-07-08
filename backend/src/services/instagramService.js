import axios from 'axios';

/**
 * Instagram Service
 * Meta Graph API client integration and engagement analytics calculation.
 */

// A curated collection of high-quality premium lifestyle and fashion images from Unsplash to display in the UI
const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80', // Lifestyle/Model
  'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80', // Makeup/Beauty
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&auto=format&fit=crop&q=80', // Portrait/Model
  'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=80', // Fashion outfit
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&auto=format&fit=crop&q=80', // Clothing/Streetwear
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=500&auto=format&fit=crop&q=80', // Cosmetics/Beauty
];

const MOCK_CAPTIONS = [
  '✨ Loving this golden hour glow. Check out the new summer collection! #aesthetic #goldenglow #lifestyle',
  '💄 Getting ready for tonight using my favorite organic skincare routine. Link in bio! #skincare #makeup #selfcare',
  '☕ Weekend vibes. Slow mornings are the best mornings. #aesthetic #cozy #weekend',
  '👗 Obsessed with this new outfit of the day. Rate it from 1-10! #ootd #styleinspo #fashionblogger',
  '📸 BTS from today\'s photoshoot. Can\'t wait to share the final results! #behindthescenes #model #photography',
  '🌸 Self-care Sunday. Taking time to recharge for the week ahead. #wellness #aesthetic #mindfulness',
];

/**
 * Generates mock Instagram statistics and posts list based on a username
 */
export const generateMockProfile = (username) => {
  const cleanedUsername = username.replace(/^@/, '');
  const followersCount = Math.floor(Math.random() * 95000) + 5000; // 5k to 100k followers
  const mediaCount = Math.floor(Math.random() * 200) + 50; // 50 to 250 posts
  
  // Engagement rates: micro-creators generally have higher rates (4-8%), macro-creators have lower rates (1.5-3.5%)
  let engagementRate = 4.5;
  if (followersCount > 50000) {
    engagementRate = parseFloat((Math.random() * 2 + 1.5).toFixed(2)); // 1.5% to 3.5%
  } else {
    engagementRate = parseFloat((Math.random() * 4 + 4.0).toFixed(2)); // 4.0% to 8.0%
  }

  // Calculate average likes and comments based on followers and engagement rate
  const totalEngagementPerPost = Math.round((followersCount * (engagementRate / 100)));
  const avgComments = Math.round(totalEngagementPerPost * 0.08); // 8% of engagement is comments
  const avgLikes = totalEngagementPerPost - avgComments;

  // Generate 6 mock recent posts
  const recentPosts = [];
  const now = new Date();

  for (let i = 0; i < 6; i++) {
    const postDate = new Date(now.getTime() - i * 2 * 24 * 60 * 60 * 1000); // every 2 days
    
    // Add random variance to individual post metrics
    const variance = 0.8 + Math.random() * 0.4; // 80% to 120% of average
    const likeCount = Math.round(avgLikes * variance);
    const commentsCount = Math.round(avgComments * variance);
    
    recentPosts.push({
      id: `ig_post_${100000 + i}`,
      permalink: `https://instagram.com/p/mock_post_${100000 + i}`,
      mediaType: i % 3 === 0 ? 'VIDEO' : 'IMAGE',
      mediaUrl: MOCK_IMAGES[i % MOCK_IMAGES.length],
      caption: MOCK_CAPTIONS[i % MOCK_CAPTIONS.length],
      likeCount,
      commentsCount,
      timestamp: postDate.toISOString(),
    });
  }

  // Generate a formatted full name
  const formattedName = cleanedUsername
    .split(/[._]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    username: cleanedUsername,
    fullName: formattedName,
    profilePicUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${cleanedUsername}`,
    followersCount,
    mediaCount,
    engagementRate,
    avgLikes,
    avgComments,
    recentPosts,
  };
};

/**
 * Calls Meta Graph API endpoints to retrieve Instagram Business Profile and Media statistics
 */
export const fetchInstagramData = async (accessToken, targetUsername) => {
  // Fall back to mock profile if using a mock token or credentials are missing
  const isMockToken = !accessToken || accessToken.startsWith('mock_');
  const hasMetaCredentials = process.env.META_APP_ID && process.env.META_APP_SECRET;

  if (isMockToken || !hasMetaCredentials) {
    console.log(`[Instagram Service] Running in Mock/Fallback mode for username: ${targetUsername}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockProfile(targetUsername);
  }

  console.log(`[Instagram Service] Connecting to Facebook/Meta Graph API for username: ${targetUsername}...`);

  try {
    // Step 1: Fetch Facebook Pages managed by the user
    const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
      params: { access_token: accessToken }
    });

    const pages = pagesResponse.data?.data || [];
    if (pages.length === 0) {
      throw new Error('No Facebook Pages found managed by this account');
    }

    let instagramBusinessAccountId = null;
    let pageNameUsed = '';

    // Step 2: Fetch linked Instagram Business Account ID
    for (const page of pages) {
      const pageDetailResponse = await axios.get(`https://graph.facebook.com/v19.0/${page.id}`, {
        params: {
          fields: 'instagram_business_account',
          access_token: accessToken
        }
      });

      if (pageDetailResponse.data?.instagram_business_account?.id) {
        instagramBusinessAccountId = pageDetailResponse.data.instagram_business_account.id;
        pageNameUsed = page.name;
        break;
      }
    }

    if (!instagramBusinessAccountId) {
      throw new Error('No Instagram Business Account linked to any managed Facebook Page');
    }

    console.log(`[Instagram Service] Found Instagram Business Account: ${instagramBusinessAccountId} linked to Facebook Page: ${pageNameUsed}`);

    // Step 3: Fetch Profile details and recent media
    const igProfileResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramBusinessAccountId}`, {
      params: {
        fields: 'username,name,profile_picture_url,followers_count,media_count,media{id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp}',
        access_token: accessToken
      }
    });

    const igData = igProfileResponse.data;
    if (!igData || !igData.username) {
      throw new Error('Failed to retrieve Instagram Business Account profile statistics');
    }

    // Step 4: Parse posts and calculate engagement metrics
    const posts = igData.media?.data || [];
    const recentPosts = posts.slice(0, 6).map(post => ({
      id: post.id,
      permalink: post.permalink || `https://instagram.com/p/mock_post_${post.id}`,
      mediaType: post.media_type || 'IMAGE',
      mediaUrl: post.media_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
      caption: post.caption || '',
      likeCount: post.like_count || 0,
      commentsCount: post.comments_count || 0,
      timestamp: post.timestamp || new Date().toISOString()
    }));

    // Calculate average likes, comments, and engagement rate
    const totalPostsCount = recentPosts.length;
    let avgLikes = 0;
    let avgComments = 0;
    let engagementRate = 0.0;

    if (totalPostsCount > 0) {
      const sumLikes = recentPosts.reduce((sum, p) => sum + p.likeCount, 0);
      const sumComments = recentPosts.reduce((sum, p) => sum + p.commentsCount, 0);
      avgLikes = Math.round(sumLikes / totalPostsCount);
      avgComments = Math.round(sumComments / totalPostsCount);
      
      const followers = igData.followers_count || 1; // prevent divide-by-zero
      const totalEngagement = avgLikes + avgComments;
      engagementRate = parseFloat(((totalEngagement / followers) * 100).toFixed(2));
    }

    return {
      username: igData.username,
      fullName: igData.name || igData.username,
      profilePicUrl: igData.profile_picture_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${igData.username}`,
      followersCount: igData.followers_count || 0,
      mediaCount: igData.media_count || 0,
      engagementRate,
      avgLikes,
      avgComments,
      recentPosts
    };

  } catch (error) {
    console.error('[Instagram Service] Meta Graph API connection failed:', error.response?.data || error.message);
    throw new Error(`Instagram sync failed: ${error.response?.data?.error?.message || error.message}`);
  }
};
