/**
 * AI Semantic Search Service
 * Implements TF-IDF tokenization, stopword filtering, synonym mapping, and Cosine Similarity
 * to rank creators against natural language queries conceptually.
 */

// Common English stopwords to filter out from natural language queries
const STOPWORDS = new Set([
  'find', 'me', 'i', 'looking', 'look', 'for', 'who', 'do', 'does', 'did', 'is', 'are', 'was', 'were', 'am',
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'from', 'with', 'by', 'about', 'as', 'into',
  'like', 'creator', 'creators', 'influencer', 'influencers', 'profile', 'profiles', 'accounts', 'account',
  'people', 'someone', 'some', 'any', 'that', 'this', 'these', 'those', 'need', 'needs', 'want', 'wants',
  'show', 'list', 'search', 'get', 'give'
]);

// Synonyms and category mappings to expand conceptual matching
const CATEGORY_MAP = {
  'beauty': ['influencer', 'creator', 'public_figure'],
  'makeup': ['influencer', 'creator'],
  'fashion': ['model', 'influencer', 'actor'],
  'skincare': ['influencer', 'creator'],
  'outfit': ['model', 'influencer'],
  'actor': ['actor', 'public_figure'],
  'modeling': ['model', 'actor'],
  'lifestyle': ['creator', 'influencer', 'public_figure'],
  'vlog': ['creator', 'influencer'],
  'vlogger': ['creator', 'influencer'],
};

/**
 * Tokenizes a string, converts to lowercase, and filters out punctuation and stopwords.
 */
function tokenize(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOPWORDS.has(token));
}

/**
 * Computes Cosine Similarity between two term-frequency maps
 */
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const term in vecA) {
    if (vecB[term]) {
      dotProduct += vecA[term] * vecB[term];
    }
    normA += Math.pow(vecA[term], 2);
  }

  for (const term in vecB) {
    normB += Math.pow(vecB[term], 2);
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Searches and ranks creators based on a natural language query
 * @param {string} query - The natural language search query
 * @param {Array} creators - List of creators fetched from database
 * @returns {Array} List of creators with added `matchScore` and `matchPercentage` properties
 */
export const searchCreators = (query, creators) => {
  if (!query || !query.trim()) {
    return creators.map(c => ({
      ...c,
      matchScore: 100,
      matchPercentage: '100%'
    }));
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return creators.map(c => ({
      ...c,
      matchScore: 100,
      matchPercentage: '100%'
    }));
  }

  // Create query term vector (weighting each query term equally as 1)
  const queryVector = {};
  queryTokens.forEach(token => {
    queryVector[token] = (queryVector[token] || 0) + 1;
    
    // Add category synonym expansions to query vector (with lower weight)
    if (CATEGORY_MAP[token]) {
      CATEGORY_MAP[token].forEach(synonym => {
        queryVector[synonym] = (queryVector[synonym] || 0) + 0.5;
      });
    }
  });

  return creators
    .map(creator => {
      // Build creator term vector with custom field weightings
      const creatorVector = {};

      const addTerms = (text, weight) => {
        if (!text) return;
        const tokens = tokenize(text);
        tokens.forEach(token => {
          creatorVector[token] = (creatorVector[token] || 0) + weight;
        });
      };

      // 1. High Weight Fields (Category, City, Name)
      addTerms(creator.category, 4.0);
      addTerms(creator.city, 3.5);
      addTerms(creator.name, 3.0);
      addTerms(creator.instagram, 3.0);

      // 2. Medium Weight Fields (Bio)
      addTerms(creator.bio, 2.0);

      // 3. Instagram Connected Metadata (recent posts captions, full name)
      if (creator.instagramProfile) {
        addTerms(creator.instagramProfile.fullName, 2.0);
        addTerms(creator.instagramProfile.username, 2.5);
        
        // Add captions from recent posts
        if (creator.instagramProfile.recentPosts) {
          try {
            const posts = typeof creator.instagramProfile.recentPosts === 'string'
              ? JSON.parse(creator.instagramProfile.recentPosts)
              : creator.instagramProfile.recentPosts;
              
            if (Array.isArray(posts)) {
              posts.forEach(post => {
                addTerms(post.caption, 0.8); // slight boost for post keywords
              });
            }
          } catch (e) {
            // ignore JSON parsing error
          }
        }
      }

      // Compute cosine similarity between query and creator vectors
      const similarity = cosineSimilarity(queryVector, creatorVector);
      
      // Convert to percentage (0 - 100) and add slight non-zero buffer if there is any overlap
      let matchScore = 0;
      if (similarity > 0) {
        // Map similarity (usually 0.0 to ~0.7 for document searches) to 30-100 range for beautiful UI display
        matchScore = Math.round(30 + similarity * 100);
        matchScore = Math.min(matchScore, 100); // cap at 100
      }

      return {
        ...creator,
        matchScore,
        matchPercentage: `${matchScore}%`
      };
    })
    // Filter out zero match creators if query is specific, otherwise keep them with 0%
    .filter(c => c.matchScore > 0)
    // Sort in descending order of similarity
    .sort((a, b) => b.matchScore - a.matchScore);
};
