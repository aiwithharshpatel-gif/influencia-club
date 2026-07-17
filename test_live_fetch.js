import { fetchInstagramData } from './backend/src/services/instagramService.js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

// Set credentials manually just in case
process.env.META_APP_ID = '4205084333135785';
process.env.META_APP_SECRET = '808a169c02de266e8dfed2943c1fde7c';

const userToken = 'EAA7wgH3tV6kBRzsPEZCz9h1EROZAaWyTaSA92IlBQBM7DBCmXYfBQxVGf5oypqnZCGbGZBr7CQZAqwPN773tFFsA0Ao49kKEv22CGaJUW1MYUJN16yQZBV8C9lzNZBUQA8UMnWRYjkXsU4ANcANnm1vKOZCcUC2SHaHB25iyvRK7OwEfBLvnr8ltf9Tb0lRpiOhMosw3LnImf9xZCC3ISRC9PU96kGZBLWUq3ZBOlw6htQUn2HQip1hqk4cR0UhGZCKb9Q50yZA4zMoKdVsKr0ROplLUi3jZBUlg7SzYPsev7WoT5eYWKHJGTHr5t4njlfOzEKwrZAX1UpmctfikwZDZD';

async function testFetch() {
  console.log('🚀 Calling fetchInstagramData with user token...');
  try {
    const data = await fetchInstagramData(userToken, 'test_user');
    console.log('\n✅ Fetch Successful!');
    console.log('--------------------------------------------------');
    console.log('Instagram Username:', data.username);
    console.log('Full Name:', data.fullName);
    console.log('Followers Count:', data.followersCount);
    console.log('Media Count:', data.mediaCount);
    console.log('Profile Pic URL:', data.profilePicUrl);
    console.log('Engagement Rate:', data.engagementRate + '%');
    console.log('Average Likes:', data.avgLikes);
    console.log('Average Comments:', data.avgComments);
    console.log('Recent Posts count:', data.recentPosts?.length);
    if (data.recentPosts?.length > 0) {
      console.log('\nSample Post Grid Preview:');
      data.recentPosts.forEach((post, i) => {
        console.log(`[Post ${i + 1}] Type: ${post.mediaType}, Likes: ${post.likeCount}, Comments: ${post.commentsCount}`);
        console.log(`  Url: ${post.mediaUrl?.substring(0, 80)}...`);
      });
    }
    console.log('--------------------------------------------------');
  } catch (err) {
    console.error('\n❌ Fetch Failed:', err.message);
  }
}

testFetch();
