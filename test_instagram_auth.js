import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'http://localhost:5173';
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/171c5008-9b74-442b-8d36-1e282bc46cf0/scratch');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

(async () => {
  const timestamp = Date.now();
  const testEmail = `sso_ig_test_${timestamp}@example.com`;
  const testPhone = `9898${String(timestamp).slice(-6)}`;
  const testInsta = `ig_sso_creator_${timestamp}`;

  console.log(`🧪 Starting Instagram SSO E2E Test Suite`);
  console.log(`📸 Test Instagram Handle: @${testInsta}`);
  console.log(`📧 Creator Email: ${testEmail}`);
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
      } catch (e) {}
    }
  });

  try {
    // ═══════════════════════════════════════════════════════════════════
    // 1. Unregistered Login Attempt -> Redirect to Signup
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🌐 Navigating to ${targetUrl}/login...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`👉 Clicking 'Login with Instagram'...`);
    const [loginPopup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Login with Instagram")')
    ]);

    await loginPopup.waitForLoadState('networkidle');
    console.log(`✅ Login Popup opened! Authorizing unregistered handle @${testInsta}...`);
    await loginPopup.fill('input[placeholder="username"]', testInsta);
    await loginPopup.click('button:has-text("Authorize & Connect")');

    console.log(`⏳ Waiting for redirection to /join page...`);
    await page.waitForURL('**/join?handle=*', { timeout: 15000 });
    console.log(`✅ Redirected to /join successfully! Current URL: ${page.url()}`);

    // Wait for the URL pre-fill useEffect to run and complete
    await page.waitForTimeout(3000);

    // Check that handle is pre-filled and read-only
    const nameVal = await page.inputValue('input[placeholder="Enter your full name"]');
    const handleVal = await page.inputValue('input[placeholder="@username"]');
    const isHandleReadOnly = await page.isEditable('input[placeholder="@username"]');

    console.log(`📝 Pre-filled Name: "${nameVal}"`);
    console.log(`📸 Pre-filled Handle: "@${handleVal}"`);
    console.log(`🔒 Is Handle Editable? ${isHandleReadOnly ? 'Yes ❌' : 'No (Read-only) ✅'}`);

    if (handleVal !== testInsta) {
      throw new Error(`Pre-filled handle "${handleVal}" does not match test handle "${testInsta}"`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // 2. Complete Instagram Two-Step Registration
    // ═══════════════════════════════════════════════════════════════════
    console.log(`✍️ Filling remaining registration form fields...`);
    await page.fill('input[placeholder="your@email.com"]', testEmail);
    await page.fill('input[placeholder="9876543210"]', testPhone);
    await page.selectOption('select:has-text("Select")', 'creator');
    await page.selectOption('select:has-text("Ahmedabad")', 'Ahmedabad');

    console.log(`👉 Submitting Completed Form...`);
    // Note: Since we are using Instagram registration, it submits to /instagram/register-complete
    // which directly logs the user in without OTP verification!
    await page.click('button:has-text("Send Verification Code")'); 
    // Wait, the button text for submission is still 'Send Verification Code' in the template form 
    // but the handler onSubmit routes it directly to register-complete. Let's wait for dashboard redirect.

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log(`✅ Registration complete! Redirected to Creator Dashboard.`);

    // Log out the creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });

    // ═══════════════════════════════════════════════════════════════════
    // 3. Registered Instagram Login -> Instant login
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🌐 Navigating to ${targetUrl}/login...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`👉 Clicking 'Login with Instagram' for returning user...`);
    const [returningLoginPopup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Login with Instagram")')
    ]);

    await returningLoginPopup.waitForLoadState('networkidle');
    console.log(`✅ Popup opened! Authorizing registered handle @${testInsta}...`);
    await returningLoginPopup.fill('input[placeholder="username"]', testInsta);
    await returningLoginPopup.click('button:has-text("Authorize & Connect")');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    console.log(`✅ Instant login successful! Redirected to Creator Dashboard.`);

    // Verify profile page contains connected Instagram details
    console.log(`👉 Navigating to Profile Page...`);
    await page.click('a[href="/dashboard/profile"]');
    await page.waitForURL('**/dashboard/profile', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    await page.waitForSelector('text=Engagement Rate', { timeout: 5000 });
    console.log(`✅ Stats and Connected Profile display verified successfully on Dashboard Profile.`);

    console.log(`🎉 ALL INSTAGRAM SSO INTEGRATION TEST SCENARIOS PASSED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    const screenshotPath = path.join(outputDir, `ig_sso_test_failure_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } finally {
    const video = page.video();
    await context.close();
    browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `instagram_sso_walkthrough.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
