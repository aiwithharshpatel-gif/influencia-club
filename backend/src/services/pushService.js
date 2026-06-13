import webpush from 'web-push';
import prisma from '../lib/prisma.js';

let vapidKeys = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY
};

const vapidSubject = process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_FROM || 'hello@influenziaclub.com'}`;

// Auto-generate VAPID keys if they are not configured
if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
  console.log('⚠️ VAPID keys not configured in environment variables.');
  console.log('🔄 Generating temporary VAPID keys for this execution session...');
  const keys = webpush.generateVAPIDKeys();
  vapidKeys.publicKey = keys.publicKey;
  vapidKeys.privateKey = keys.privateKey;
  console.log('=====================================================');
  console.log('🔑 TEMPORARY VAPID PUBLIC KEY (Save to your .env):');
  console.log(vapidKeys.publicKey);
  console.log('🔑 TEMPORARY VAPID PRIVATE KEY (Save to your .env):');
  console.log(vapidKeys.privateKey);
  console.log('=====================================================');
}

// Set VAPID details
webpush.setVapidDetails(
  vapidSubject,
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export const getVapidPublicKey = () => {
  return vapidKeys.publicKey;
};

/**
 * Sends a push notification to all active push subscriptions for a user email.
 * @param {string} email - Recipient email
 * @param {string} role - Recipient role ('creator' or 'brand')
 * @param {object} payload - Notification data containing title, body, url etc.
 */
export const sendPushNotification = async (email, role, payload) => {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { email, role }
    });

    if (subscriptions.length === 0) {
      console.log(`[Push Notification] No subscriptions found for ${email} (${role})`);
      return;
    }

    console.log(`[Push Notification] Sending notification to ${subscriptions.length} device(s) for ${email}...`);
    const payloadStr = JSON.stringify(payload);

    const promises = subscriptions.map(async (sub) => {
      try {
        const subObj = {
          endpoint: sub.endpoint,
          keys: sub.keys
        };
        await webpush.sendNotification(subObj, payloadStr);
        console.log(`[Push Notification] Successfully sent to endpoint: ${sub.endpoint.substring(0, 45)}...`);
      } catch (err) {
        // If the subscription is gone or expired, delete it from the database
        if (err.statusCode === 410 || err.statusCode === 404) {
          console.log(`[Push Notification] Subscription expired/invalid (status: ${err.statusCode}). Cleaning up...`);
          await prisma.pushSubscription.delete({
            where: { id: sub.id }
          });
        } else {
          console.error(`[Push Notification] Failed to send to endpoint ${sub.endpoint.substring(0, 45)}...:`, err.message);
        }
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('[Push Notification] Error sending notification:', error);
  }
};
