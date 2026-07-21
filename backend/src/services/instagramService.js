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
  // Fall back to mock profile if using a mock token, credentials are missing, or app is not live
  const isMockToken = !accessToken || accessToken.startsWith('mock_');
  const isLive = process.env.META_APP_LIVE === 'true';
  const hasMetaCredentials = process.env.META_APP_ID && process.env.META_APP_SECRET && isLive;

  if (isMockToken || !hasMetaCredentials) {
    console.log(`[Instagram Service] Running in Mock/Fallback mode for username: ${targetUsername}`);
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateMockProfile(targetUsername);
  }

  console.log(`[Instagram Service] Connecting to Facebook/Meta Graph API for username: ${targetUsername}...`);

  try {
    let igData = null;
    let directFetchSuccess = false;

    // Try direct Instagram user profile fetch via graph.facebook.com/me (supported for Instagram Business Login tokens)
    try {
      console.log('[Instagram Service] Attempting direct profile fetch via graph.facebook.com/me...');
      const directResponse = await axios.get('https://graph.facebook.com/v19.0/me', {
        params: {
          fields: 'username,name,profile_picture_url,followers_count,media_count,media{id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp}',
          access_token: accessToken
        }
      });
      igData = directResponse.data;
      if (igData && igData.username && igData.followers_count !== undefined) {
        directFetchSuccess = true;
        console.log(`[Instagram Service] Direct profile fetch successful for user: ${igData.username}`);
      }
    } catch (directError) {
      console.log('[Instagram Service] Direct fetch on graph.facebook.com failed, trying graph.instagram.com/me...', directError.message);
      try {
        const directIgResponse = await axios.get('https://graph.instagram.com/v19.0/me', {
          params: {
            fields: 'id,username,name,profile_picture_url,followers_count,media_count',
            access_token: accessToken
          }
        });
        if (directIgResponse.data && directIgResponse.data.username) {
          igData = directIgResponse.data;
          
          // Fetch media with engagement metrics using the user's IG numeric ID
          const igUserId = igData.id;
          console.log(`[Instagram Service] Direct basic profile fetched (ID: ${igUserId}). Fetching media with engagement metrics...`);

          // Strategy 1: Try graph.instagram.com/{user-id}/media with like_count,comments_count
          let mediaFetched = false;
          try {
            const mediaResponse = await axios.get(`https://graph.instagram.com/v19.0/${igUserId}/media`, {
              params: {
                fields: 'id,caption,media_url,media_type,permalink,like_count,comments_count,timestamp',
                access_token: accessToken
              }
            });
            igData.media = mediaResponse.data;
            mediaFetched = true;
            console.log('[Instagram Service] Media fetched with engagement fields via /{user-id}/media');
          } catch (mediaError1) {
            console.log('[Instagram Service] /{user-id}/media with engagement fields failed:', mediaError1.response?.data?.error?.message || mediaError1.message);
          }

          // Strategy 2: Fetch basic media list, then fetch each post's details individually for like_count
          if (!mediaFetched) {
            try {
              console.log('[Instagram Service] Trying basic media list + per-post detail fetch...');
              const basicMediaResponse = await axios.get(`https://graph.instagram.com/v19.0/${igUserId}/media`, {
                params: {
                  fields: 'id,caption,media_url,media_type,permalink,timestamp',
                  access_token: accessToken
                }
              });
              const basicPosts = basicMediaResponse.data?.data || [];
              
              // Fetch like_count and comments_count for each post individually
              const enrichedPosts = [];
              for (const post of basicPosts.slice(0, 6)) {
                try {
                  const postDetail = await axios.get(`https://graph.instagram.com/v19.0/${post.id}`, {
                    params: {
                      fields: 'id,like_count,comments_count',
                      access_token: accessToken
                    }
                  });
                  enrichedPosts.push({
                    ...post,
                    like_count: postDetail.data.like_count || 0,
                    comments_count: postDetail.data.comments_count || 0,
                  });
                  console.log(`[Instagram Service] Post ${post.id}: likes=${postDetail.data.like_count}, comments=${postDetail.data.comments_count}`);
                } catch (postError) {
                  console.log(`[Instagram Service] Could not fetch details for post ${post.id}:`, postError.response?.data?.error?.message || postError.message);
                  enrichedPosts.push({ ...post, like_count: 0, comments_count: 0 });
                }
              }
              
              igData.media = { data: enrichedPosts };
              mediaFetched = true;
              console.log('[Instagram Service] Media enriched with per-post engagement data');
            } catch (mediaError2) {
              console.log('[Instagram Service] Basic media + per-post detail fetch failed:', mediaError2.response?.data?.error?.message || mediaError2.message);
            }
          }

          // Strategy 3: Last resort - basic media list without engagement metrics
          if (!mediaFetched) {
            try {
              console.log('[Instagram Service] Last resort: fetching basic media without engagement metrics...');
              const fallbackMediaResponse = await axios.get(`https://graph.instagram.com/v19.0/me/media`, {
                params: {
                  fields: 'id,caption,media_url,media_type,permalink,timestamp',
                  access_token: accessToken
                }
              });
              igData.media = fallbackMediaResponse.data;
              console.log('[Instagram Service] Basic media fetched (no engagement data available)');
            } catch (lastError) {
              console.log('[Instagram Service] All media fetch strategies failed:', lastError.message);
              igData.media = { data: [] };
            }
          }

          directFetchSuccess = true;
          console.log(`[Instagram Service] Direct Instagram Login profile & media fetch successful for user: ${igData.username}`);
        }
      } catch (igError) {
        console.log('[Instagram Service] Direct fetch on graph.instagram.com/me failed. Falling back to Pages lookup...', igError.message);
      }
    }

    // Fallback: Use standard Facebook Login Pages lookup flow
    if (!directFetchSuccess) {
      console.log('[Instagram Service] Running fallback Facebook Pages lookup flow...');
      const pagesResponse = await axios.get('https://graph.facebook.com/v19.0/me/accounts', {
        params: { access_token: accessToken }
      });

      const pages = pagesResponse.data?.data || [];
      if (pages.length === 0) {
        throw new Error('No Facebook Pages found managed by this account');
      }

      let instagramBusinessAccountId = null;
      let pageNameUsed = '';

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

      const igProfileResponse = await axios.get(`https://graph.facebook.com/v19.0/${instagramBusinessAccountId}`, {
        params: {
          fields: 'username,name,profile_picture_url,followers_count,media_count,media{id,caption,media_type,media_url,permalink,like_count,comments_count,timestamp}',
          access_token: accessToken
        }
      });

      igData = igProfileResponse.data;
    }

    if (!igData || !igData.username) {
      throw new Error('Failed to retrieve Instagram profile statistics');
    }

    // Step 4: Parse posts and calculate engagement metrics
    const posts = igData.media?.data || [];
    if (posts.length > 0) {
      console.log('[Instagram Service] First post raw data from Meta Graph:', JSON.stringify(posts[0], null, 2));
    }
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

/**
 * Exchanges the OAuth authorization code for a long-lived access token.
 * Falls back to mock if Meta credentials are not configured or code is mock.
 */
export const getLongLivedAccessToken = async (authCode, redirectUri) => {
  const isMock = !authCode || authCode.startsWith('mock_');
  const isLive = process.env.META_APP_LIVE === 'true';
  const hasMetaCredentials = process.env.META_APP_ID && process.env.META_APP_SECRET && isLive;

  if (isMock || !hasMetaCredentials) {
    console.log('[Instagram Service] Mock/Fallback token exchange');
    return authCode || 'mock_access_token_123';
  }

  try {
    // Clean the authorization code — Instagram appends #_ to the redirect URL
    const cleanCode = authCode.replace(/#_$/, '').trim();
    console.log('[Instagram Service] Exchanging authorization code for short-lived user token...');
    console.log(`[Instagram Service] App ID: ${process.env.META_APP_ID}, Redirect URI: ${redirectUri}`);
    console.log(`[Instagram Service] Auth code (cleaned): ${cleanCode.substring(0, 20)}...`);
    
    // Step 1: Exchange code for short-lived access token (MUST be POST)
    const tokenParams = new URLSearchParams();
    tokenParams.append('client_id', process.env.META_APP_ID);
    tokenParams.append('client_secret', process.env.META_APP_SECRET);
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('redirect_uri', redirectUri);
    tokenParams.append('code', cleanCode);

    console.log('[Instagram Service] Step 1: POST to api.instagram.com/oauth/access_token...');
    const tokenExchangeResponse = await axios.post('https://api.instagram.com/oauth/access_token', tokenParams, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('[Instagram Service] Step 1 Response Data:', JSON.stringify(tokenExchangeResponse.data));

    const shortLivedToken = tokenExchangeResponse.data.access_token;
    if (!shortLivedToken) {
      throw new Error('No short-lived access token received from Meta');
    }

    console.log('[Instagram Service] Exchanging short-lived user token for long-lived user token...');
    console.log(`[Instagram Service] Short-lived token starts with: ${shortLivedToken.substring(0, 10)}...`);
    
    // Step 2: Exchange short-lived token for long-lived token (60 days)
    // Try POST first (newer Meta API behavior), fall back to GET if POST fails
    let longLivedToken = null;

    try {
      // POST method (required by newer Meta API versions)
      const llTokenParams = new URLSearchParams();
      llTokenParams.append('grant_type', 'ig_exchange_token');
      llTokenParams.append('client_secret', process.env.META_APP_SECRET);
      llTokenParams.append('access_token', shortLivedToken);

      console.log('[Instagram Service] Step 2: POST to graph.instagram.com/access_token...');
      const longLivedTokenResponse = await axios.post('https://graph.instagram.com/access_token', llTokenParams, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log('[Instagram Service] Step 2 Response status:', longLivedTokenResponse.status);
      longLivedToken = longLivedTokenResponse.data.access_token;
    } catch (postError) {
      console.log('[Instagram Service] Step 2 POST failed, trying GET fallback...', postError.response?.data?.error?.message || postError.message);
      try {
        // GET fallback (legacy Meta API behavior)
        const longLivedTokenResponse = await axios.get('https://graph.instagram.com/access_token', {
          params: {
            grant_type: 'ig_exchange_token',
            client_secret: process.env.META_APP_SECRET,
            access_token: shortLivedToken
          }
        });

        console.log('[Instagram Service] Step 2 GET Response status:', longLivedTokenResponse.status);
        longLivedToken = longLivedTokenResponse.data.access_token;
      } catch (getError) {
        console.warn('[Instagram Service] Both long-lived token exchange methods failed. Falling back to short-lived token.', getError.response?.data?.error?.message || getError.message);
      }
    }

    if (!longLivedToken) {
      // If long-lived token exchange fails entirely, use the short-lived token
      // It will work for ~1 hour, which is enough to fetch profile data
      console.warn('[Instagram Service] Long-lived token exchange failed, using short-lived token as fallback');
      return shortLivedToken;
    }

    return longLivedToken;
  } catch (error) {
    console.error('[Instagram Service] Token exchange failed. Detailed error response:');
    if (error.response) {
      console.error('[Instagram Service] Status:', error.response.status);
      console.error('[Instagram Service] Headers:', JSON.stringify(error.response.headers));
      console.error('[Instagram Service] Data:', JSON.stringify(error.response.data));
    } else {
      console.error('[Instagram Service] Message:', error.message);
    }
    throw new Error(`Instagram token exchange failed: ${error.response?.data?.error_message || error.response?.data?.error?.message || error.message}`);
  }
};

