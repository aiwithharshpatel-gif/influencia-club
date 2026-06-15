import prisma from '../lib/prisma.js';

/**
 * Notification Inbox Service
 * Creates persistent notification records and emits real-time Socket.io events
 */

/**
 * Create a new notification and emit it via Socket.io
 * @param {Object} params
 * @param {string} params.recipientId - Creator ID, brand email, or admin ID
 * @param {string} params.recipientType - 'creator' | 'brand' | 'admin'
 * @param {string} params.type - 'payment' | 'milestone' | 'payout' | 'campaign' | 'system' | 'approval'
 * @param {string} params.title - Short notification title
 * @param {string} params.message - Full notification message
 * @param {string} [params.link] - Optional link/route to navigate to
 * @param {Object} [io] - Socket.io instance (optional, for real-time emit)
 */
export const createNotification = async ({ recipientId, recipientType, type, title, message, link }, io = null) => {
  try {
    const notification = await prisma.notification.create({
      data: {
        recipientId,
        recipientType,
        type,
        title,
        message,
        link: link || null
      }
    });

    // Emit real-time event if Socket.io instance is available
    if (io) {
      io.to(recipientId).emit('notification', {
        id: notification.id,
        type,
        title,
        message,
        link,
        createdAt: notification.createdAt
      });
    }

    console.log(`[Notification] Created "${type}" notification for ${recipientType}:${recipientId} — "${title}"`);
    return notification;
  } catch (error) {
    console.error('[Notification] Failed to create notification:', error);
    // Don't throw — notifications are non-critical
    return null;
  }
};

/**
 * Get paginated notifications for a user
 */
export const getNotifications = async (recipientId, recipientType, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId, recipientType },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.notification.count({
      where: { recipientId, recipientType }
    })
  ]);

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * Get unread count for a user
 */
export const getUnreadCount = async (recipientId, recipientType) => {
  const count = await prisma.notification.count({
    where: { recipientId, recipientType, isRead: false }
  });
  return count;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId) => {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true }
  });
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (recipientId, recipientType) => {
  return prisma.notification.updateMany({
    where: { recipientId, recipientType, isRead: false },
    data: { isRead: true }
  });
};
