import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to convert base64 VAPID public key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Checks if push notifications are supported and permitted
 */
export const getNotificationPermissionState = () => {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return 'unsupported';
  }
  return Notification.permission;
};

/**
 * Subscribes the client browser to push notifications
 */
export const subscribeUserToPush = async () => {
  try {
    if (getNotificationPermissionState() === 'unsupported') {
      throw new Error('Push notifications are not supported in this browser.');
    }

    // 1. Request browser permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted.');
    }

    // 2. Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Get VAPID public key from backend
    const vapidKeyRes = await axios.get(`${API_URL}/notifications/vapid-key`, {
      withCredentials: true
    });
    if (!vapidKeyRes.data.success || !vapidKeyRes.data.publicKey) {
      throw new Error('Failed to retrieve VAPID public key.');
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidKeyRes.data.publicKey);

    // 4. Subscribe with pushManager
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey
    });

    // 5. Save subscription details on the backend
    await axios.post(`${API_URL}/notifications/subscribe`, {
      subscription
    }, {
      withCredentials: true
    });

    console.log('[Push Service] Browser successfully subscribed to push notifications.');
    return true;
  } catch (error) {
    console.error('[Push Service] Subscription error:', error);
    throw error;
  }
};

/**
 * Unsubscribes the client browser from push notifications
 */
export const unsubscribeUserFromPush = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // 1. Unsubscribe on browser side
      await subscription.unsubscribe();

      // 2. Delete subscription from backend
      await axios.post(`${API_URL}/notifications/unsubscribe`, {
        endpoint: subscription.endpoint
      }, {
        withCredentials: true
      });

      console.log('[Push Service] Browser successfully unsubscribed.');
    }
    return true;
  } catch (error) {
    console.error('[Push Service] Unsubscribe error:', error);
    throw error;
  }
};
