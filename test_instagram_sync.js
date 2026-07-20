import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'http://localhost:5173';
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/5cb4e729-c13f-4aa6-b147-b4f46a260496');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

(async () => {
  const timestamp = Date.now();
  const testEmail = `e2e_ig_sync_${timestamp}@example.com`;
  const testName = `E2E IG SyncTest ${timestamp}`;
  const testPhone = `77777${String(timestamp).slice(-5)}`;
  const testInsta = `e2e_insta_sync_${timestamp}`;

  console.log(`🧪 Starting Instagram Stats Sync E2E Test Suite`);
  console.log(`📧 Creator Email: ${testEmail}`);
  console.log(`📸 Initial Instagram Handle: ${testInsta}`);
  console.log(`🔗 Target URL: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    },
    extraHTTPHeaders: {
      'X-Forwarded-For': generateRandomIP(),
      'x-test-bypass': 'true'
    }
  });

  const page = await context.newPage();

  // Log API responses for debugging
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      try {
        const status = response.status();
        const url = response.url();
        const text = await response.text();
        console.log(`[API RESPONSE] ${status} - ${url} => ${text.substring(0, 150)}`);
      } catch (e) {
        // Suppress errors for non-json responses
      }
    }
  });

  try {
    // ═══════════════════════════════════════════════════════════════════
    // 1. Creator Registration & Verification
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🌐 Navigating to ${targetUrl}/join...`);
    await page.goto(`${targetUrl}/join`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Filling registration form...`);
    await page.fill('input[placeholder="Enter your full name"]', testName);
    await page.fill('input[placeholder="your@email.com"]', testEmail);
    await page.fill('input[placeholder="9876543210"]', testPhone);
    await page.fill('input[placeholder="@username"]', testInsta);
    await page.selectOption('select:has-text("Select")', 'influencer');
    await page.selectOption('select:has-text("Ahmedabad")', 'Ahmedabad');

    console.log(`👉 Clicking 'Send Verification Code'...`);
    await page.click('button:has-text("Send Verification Code")');

    console.log(`⏳ Waiting for OTP input screen...`);
    await page.waitForSelector('input[placeholder="000000"]', { timeout: 15000 });

    // Fetch OTP
    console.log(`🔍 Fetching OTP for ${testEmail}...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const otpResponse = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${testEmail}`, {
      headers: { 'x-test-bypass': 'true' }
    });
    if (!otpResponse.ok()) {
      throw new Error(`Failed to fetch OTP: ${otpResponse.status()}`);
    }
    const otpData = await otpResponse.json();
    const otp = otpData.otp;
    console.log(`🔑 Retrieved OTP: ${otp}`);

    // Submit OTP
    await page.fill('input[placeholder="000000"]', otp);
    await page.click('button:has-text("Verify Email")');

    // Wait for success screen
    await page.waitForSelector('text=Welcome to Influenzia Club!', { timeout: 10000 });
    console.log(`✅ Creator Registration completed!`);

    await page.click('a:has-text("Go to Dashboard")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // ═══════════════════════════════════════════════════════════════════
    // 2. Connect Instagram Profile
    // ═══════════════════════════════════════════════════════════════════
    console.log(`👉 Navigating to Profile Page...`);
    await page.click('a[href="/dashboard/profile"]');
    await page.waitForURL('**/dashboard/profile', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`👉 Launching Mock Instagram connection popup...`);
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Connect Instagram")')
    ]);

    await popup.waitForLoadState('networkidle');
    console.log(`✅ Popup opened! Authorizing mock account @${testInsta}...`);
    await popup.fill('input[placeholder="username"]', testInsta);
    await popup.click('button:has-text("Authorize & Connect")');

    console.log(`⏳ Waiting for popup to close and stats to sync...`);
    await page.waitForTimeout(3000);

    // Verify statistics display on Creator profile
    console.log(`👉 Verifying synced statistics display...`);
    await page.waitForSelector('text=Engagement Rate', { timeout: 5000 });
    await page.waitForSelector('text=Recent Posts Feed Preview', { timeout: 5000 });
    console.log(`✅ Connected Instagram details rendered successfully!`);

    // ═══════════════════════════════════════════════════════════════════
    // 3. Trigger Manual Stats Synchronization
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🔄 Clicking 'Sync Metrics' button...`);
    const syncBtn = page.locator('button#sync-instagram-btn');
    await syncBtn.click();

    console.log(`⏳ Waiting for sync success toast...`);
    await page.waitForSelector('text=Instagram statistics refreshed successfully!', { timeout: 10000 });
    console.log(`✅ Manual Instagram stats synchronization verified!`);

    // Logout Creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });

    // ═══════════════════════════════════════════════════════════════════
    // 4. Admin Bulk Sync Trigger
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🌐 Navigating to Admin Login...`);
    await page.goto(`${targetUrl}/admin-login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input#admin_email', 'admin@influenziaclub.com');
    await page.fill('input#admin_password', 'Admin@12345');
    await page.click('button#admin_login_submit');

    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Admin logged in!`);

    // Trigger bulk refresh API via custom POST request
    console.log(`⚙️ Sending Admin Bulk Refresh Request...`);
    const adminBulkRefreshRes = await page.request.post(`${targetUrl}/api/admin/creators/instagram/refresh-all`, {
      headers: { 'x-test-bypass': 'true' }
    });

    if (!adminBulkRefreshRes.ok()) {
      throw new Error(`Admin bulk refresh failed: ${adminBulkRefreshRes.status()}`);
    }
    const adminBulkData = await adminBulkRefreshRes.json();
    if (!adminBulkData.success) {
      throw new Error(`Admin bulk refresh returned error status`);
    }
    console.log(`✅ Admin bulk stats refresh successfully triggered!`);

    // Logout Admin
    console.log(`👉 Logging out Admin...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });

    console.log(`🎉 ALL INSTAGRAM METRICS SYNCHRONIZATION TEST SCENARIOS COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    const screenshotPath = path.join(outputDir, `ig_sync_test_failure_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } finally {
    const video = page.video();
    await context.close();
    browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `instagram_sync_walkthrough.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
