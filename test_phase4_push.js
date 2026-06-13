import { chromium } from 'playwright';
import path from 'path';

const targetUrl = 'https://test.influenziaclub.com';

const brandEmail = 'e2e_brand_1781258450000@example.com';
const creatorEmail = 'e2ecreator_1781258450000@example.com';
const creatorPhone = '9999999999';

function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

console.log(`🧪 Starting E2E Automation for Phase 4: Web Push Notifications`);
console.log(`📧 Brand Email: ${brandEmail}`);
console.log(`📧 Creator Email: ${creatorEmail}`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: {
      'X-Forwarded-For': generateRandomIP(),
      'x-test-bypass': 'true'
    }
  });

  const page = await context.newPage();

  // Helper to fetch OTP from API
  async function fetchOTP(email) {
    console.log(`🔍 Querying API endpoint to fetch OTP for ${email}...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const response = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${email}`, {
      headers: { 'x-test-bypass': 'true' }
    });
    if (!response.ok()) {
      throw new Error(`Failed to fetch OTP: ${response.status()}`);
    }
    const data = await response.json();
    if (!data.success || !data.otp) {
      throw new Error(`Could not retrieve OTP: ${JSON.stringify(data)}`);
    }
    console.log(`🔑 Retrieved OTP: ${data.otp}`);
    return data.otp;
  }

  try {
    // 1. Login as Creator and Register Mock Push Subscription
    console.log(`🌐 Navigating to login page...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Logging in as Creator...`);
    await page.fill('input[placeholder="your@email.com"]', creatorEmail);
    await page.fill('input[placeholder="********"]', creatorPhone);
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged in to Creator Dashboard!`);

    // Verify VAPID Key retrieval via API
    console.log(`🔍 Checking VAPID public key API endpoint...`);
    const vapidRes = await page.request.get(`${targetUrl}/api/notifications/vapid-key`, {
      headers: { 'x-test-bypass': 'true' }
    });
    if (!vapidRes.ok()) {
      throw new Error(`Failed to fetch VAPID key: ${vapidRes.status()}`);
    }
    const vapidData = await vapidRes.json();
    console.log(`🔑 VAPID Public Key: ${vapidData.publicKey}`);

    // Subscribe mock endpoint
    console.log(`✍️ Subscribing mock push endpoint for Creator...`);
    const subscribeRes = await page.request.post(`${targetUrl}/api/notifications/subscribe`, {
      data: {
        subscription: {
          endpoint: 'https://fcm.googleapis.com/fcm/send/mock-e2e-token-creator-987654',
          keys: {
            p256dh: 'BLm7F7J42241694m7F7J42241694m7F7J42241694m7F7J42241694m7F7J42241694m7F7J42241694m7F7J4',
            auth: 'authauthauth1234'
          }
        }
      },
      headers: { 'x-test-bypass': 'true' }
    });

    if (!subscribeRes.ok()) {
      throw new Error(`Mock subscription registration failed: ${subscribeRes.status()}`);
    }
    console.log(`✅ Mock subscription registered successfully!`);

    // Logout Creator
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Creator logged out!`);

    // 2. Login as Brand
    console.log(`🌐 Navigating to ${targetUrl}/brand-login...`);
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Requesting login code...`);
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');

    const brandOTP = await fetchOTP(brandEmail);

    console.log(`✍️ Entering OTP and logging in...`);
    await page.fill('input[placeholder="000000"]', brandOTP);
    await page.click('button:has-text("Verify & Log In")');

    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged in to Brand Dashboard!`);

    // 3. Send a message to Creator to trigger push dispatch
    console.log(`👉 Navigating to Brand Messages...`);
    await page.click('a[href="/brand/dashboard/messages"]');
    await page.waitForURL('**/brand/dashboard/messages', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log(`👉 Selecting E2E Creator message thread...`);
    await page.click('button:has-text("E2E Creator")');
    await page.waitForTimeout(2000);

    console.log(`✍️ Sending push-triggering chat message...`);
    const messageInput = page.locator('input[placeholder="Type a message..."]');
    await messageInput.fill('Push notifications test message!');
    await page.click('button:has(svg)');

    await page.waitForTimeout(4000); // Wait for async push service execution
    console.log(`✅ Trigger message sent successfully!`);

    console.log(`🎉 ALL PHASE 4 E2E TEST STEPS EXECUTED!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
  } finally {
    await context.close();
    await browser.close();
  }
})();
