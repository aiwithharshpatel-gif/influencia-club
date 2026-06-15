import prisma from '../lib/prisma.js';
import { fetchInstagramData } from './instagramService.js';
import { formatFollowers } from '../utils/helpers.js';

/**
 * Iterates through all connected Instagram profiles, fetches their latest
 * metrics, and updates both the profile and parent Creator records in the database.
 */
export const runInstagramAutoSync = async () => {
  console.log('[Instagram Sync Scheduler] Starting auto-sync for all connected profiles...');
  try {
    const profiles = await prisma.instagramProfile.findMany();
    console.log(`[Instagram Sync Scheduler] Found ${profiles.length} profiles to update.`);

    let successCount = 0;
    let failureCount = 0;

    for (const profile of profiles) {
      try {
        console.log(`[Instagram Sync Scheduler] Syncing @${profile.username} (Creator ID: ${profile.creatorId})...`);
        
        // Fetch new stats from mock/Meta API
        const igData = await fetchInstagramData(profile.accessToken || 'mock_access_token_123', profile.username);

        // Update InstagramProfile
        await prisma.instagramProfile.update({
          where: { id: profile.id },
          data: {
            fullName: igData.fullName,
            profilePicUrl: igData.profilePicUrl,
            followersCount: igData.followersCount,
            mediaCount: igData.mediaCount,
            engagementRate: igData.engagementRate,
            avgLikes: igData.avgLikes,
            avgComments: igData.avgComments,
            recentPosts: igData.recentPosts,
          }
        });

        // Update parent Creator
        const formatted = formatFollowers(igData.followersCount);
        await prisma.creator.update({
          where: { id: profile.creatorId },
          data: {
            followerCount: formatted
          }
        });

        console.log(`[Instagram Sync Scheduler] Synced @${profile.username} successfully.`);
        successCount++;
      } catch (err) {
        console.error(`[Instagram Sync Scheduler] Failed to sync @${profile.username}:`, err);
        failureCount++;
      }
    }

    console.log(`[Instagram Sync Scheduler] Completed! Success: ${successCount}, Failures: ${failureCount}`);
    return { successCount, failureCount };
  } catch (error) {
    console.error('[Instagram Sync Scheduler] Critical error running auto-sync:', error);
    throw error;
  }
};

/**
 * Initializes the daily automatic sync scheduler.
 */
export const startInstagramSyncScheduler = () => {
  console.log('[Instagram Sync Scheduler] Initializing daily stats sync background scheduler.');

  // Run initial sync 1 minute after server starts
  setTimeout(() => {
    console.log('[Instagram Sync Scheduler] Running initial server startup auto-sync...');
    runInstagramAutoSync().catch(err => {
      console.error('[Instagram Sync Scheduler] Initial auto-sync error:', err);
    });
  }, 60000);

  // Run every 24 hours
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    console.log('[Instagram Sync Scheduler] Triggering scheduled daily auto-sync...');
    runInstagramAutoSync().catch(err => {
      console.error('[Instagram Sync Scheduler] Daily auto-sync error:', err);
    });
  }, TWENTY_FOUR_HOURS);
};
