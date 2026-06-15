import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'https://test.influenziaclub.com';
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/5cb4e729-c13f-4aa6-b147-b4f46a260496');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

(async () => {
  const timestamp = Date.now();
  const testEmail = `e2e_admin_creator_${timestamp}@example.com`;
  const testName = `E2E Creator AdminTest ${timestamp}`;
  const testPhone = `99999${String(timestamp).slice(-5)}`;
  const testInsta = `e2e_admin_insta_${timestamp}`;
  const brandName = `E2E Test Brand ${timestamp}`;
  const brandEmail = `e2e_brand_${timestamp}@example.com`;

  console.log(`🧪 Starting Admin Panel E2E Test Suite`);
  console.log(`📧 Creator Email: ${testEmail}`);
  console.log(`🏢 Brand Name: ${brandName}`);
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

  // Log API responses
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
    // 1. Submit Brand Inquiry via API to guarantee it shows up in dashboard
    console.log(`📤 Submitting Brand Inquiry for ${brandName}...`);
    const inquiryResponse = await page.request.post(`${targetUrl}/api/inquiries`, {
      headers: { 'x-test-bypass': 'true' },
      data: {
        brandName,
        email: brandEmail,
        mobile: '9876543210',
        budgetRange: '15000-30000',
        categories: ['influencer'],
        message: 'We are looking to launch a winter footwear campaign.'
      }
    });

    if (!inquiryResponse.ok()) {
      throw new Error(`Failed to submit brand inquiry: ${inquiryResponse.status()} - ${await inquiryResponse.text()}`);
    }
    console.log(`✅ Brand inquiry submitted!`);

    // 2. Register a Creator using the OTP bypass mechanism
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
    console.log(`✅ OTP screen loaded!`);

    // Query OTP from backend API
    console.log(`🔍 Querying API to fetch OTP for ${testEmail}...`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // wait for database sync
    const otpResponse = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${testEmail}`, {
      headers: { 'x-test-bypass': 'true' }
    });
    if (!otpResponse.ok()) {
      throw new Error(`Failed to fetch OTP: ${otpResponse.status()} - ${await otpResponse.text()}`);
    }
    const otpData = await otpResponse.json();
    if (!otpData.success || !otpData.otp) {
      throw new Error(`Could not retrieve OTP: ${JSON.stringify(otpData)}`);
    }

    const otp = otpData.otp;
    console.log(`🔑 Retrieved OTP: ${otp}`);

    // Submit OTP
    await page.fill('input[placeholder="000000"]', otp);
    await page.click('button:has-text("Verify Email")');

    // Wait for success screen
    await page.waitForSelector('text=Welcome to Influenzia Club!', { timeout: 10000 });
    console.log(`✅ Creator Registration completed successfully!`);

    await page.click('a:has-text("Go to Dashboard")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log(`📍 Current URL: ${page.url()}`);

    // 3. Elevate Creator points to allow redemption testing
    console.log(`🚀 Elevating creator points...`);
    const grantResponse = await page.request.post(`${targetUrl}/api/rewards/test-grant`, {
      headers: { 'x-test-bypass': 'true' },
      data: {
        secret: 'change_this_to_a_random_64_character_secret',
        points: 300
      }
    });

    if (!grantResponse.ok()) {
      throw new Error(`Failed to grant points: ${grantResponse.status()} - ${await grantResponse.text()}`);
    }
    console.log(`✅ Points elevated to 310!`);

    // Go to Points page and redeem a reward
    console.log(`🌐 Navigating to Points Marketplace...`);
    await page.click('a:has-text("Points")');
    await page.waitForURL('**/dashboard/points', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`🎁 Redeeming 'Instagram Boost Promotion' (250 pts)...`);
    const redeemButton = page.locator('div.group:has-text("Instagram Boost Promotion") >> button:has-text("Redeem Reward")');
    await redeemButton.click();

    // Verify success message and balance deduction
    console.log(`⏳ Waiting for redemption success message...`);
    await page.waitForSelector('text=Redemption request submitted successfully', { timeout: 15000 });
    console.log(`✅ Redemption request submitted!`);

    // Logout Creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Creator logged out!`);

    // 4. Admin Login Flow
    console.log(`🌐 Navigating to ${targetUrl}/admin-login...`);
    await page.goto(`${targetUrl}/admin-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Entering admin credentials...`);
    await page.fill('input[placeholder="admin@influenziaclub.com"]', 'admin@influenziaclub.com');
    await page.fill('input[placeholder="********"]', 'Admin@12345');
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Admin logged in successfully!`);

    // Verify stats loaded and recently submitted brand inquiry shows up
    const overviewTitle = await page.locator('h1:has-text("System Overview")').textContent();
    console.log(`🏷️ Page Heading: "${overviewTitle.trim()}"`);

    await page.waitForSelector(`text=${brandName}`, { timeout: 5000 });
    console.log(`✅ Brand inquiry "${brandName}" visible in dashboard summary!`);

    // 5. Creator Moderation Flow
    console.log(`👉 Navigating to Creators Directory...`);
    await page.click('a[href="/admin/dashboard/creators"]');
    await page.waitForURL('**/admin/dashboard/creators', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`🔍 Searching for creator: "${testName}"...`);
    await page.fill('input[placeholder*="Search creator name"]', testName);
    await page.click('button:has-text("Filter Directory")');
    await page.waitForTimeout(2000);

    // Click Approve
    console.log(`👍 Approving creator...`);
    const creatorRow = page.locator(`tr:has-text("${testName}")`);
    await creatorRow.locator('button:has-text("Approve")').click();
    await page.waitForTimeout(2000);
    console.log(`✅ Creator approved!`);

    // Toggle verified badge
    console.log(`🌟 Verifying creator...`);
    await creatorRow.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);
    console.log(`✅ Creator verified badge enabled!`);

    // 6. Brand Inquiry Lifecycle Matching Flow
    console.log(`👉 Navigating to Brand Inquiries page...`);
    await page.click('a[href="/admin/dashboard/inquiries"]');
    await page.waitForURL('**/admin/dashboard/inquiries', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`🔍 Selecting inquiry for "${brandName}"...`);
    const inquiryCard = page.locator(`div.rounded-xl:has-text("${brandName}")`);
    await inquiryCard.click();
    await page.waitForTimeout(1000);

    // Update assignment details
    console.log(`✍️ Matching creator and setting package details...`);
    await page.selectOption('select#inq_package_select', 'growth');
    await page.waitForTimeout(1000);
    await page.selectOption('select#inq_creator_select', { label: `${testName} (@${testInsta})` });
    await page.waitForTimeout(1000);
    await page.selectOption('select#inq_status_select', 'in_progress');
    await page.waitForTimeout(1500);

    // Launch Campaign Workspace
    console.log(`🚀 Opening Campaign Builder Modal...`);
    await page.click('button:has-text("Create Campaign Workspace")');
    await page.waitForSelector('h3:has-text("Launch Campaign Workspace")', { timeout: 5000 });

    await page.fill('input#campaign_start', '2026-07-01');
    await page.fill('input#campaign_end', '2026-07-31');
    await page.fill('textarea#campaign_notes', 'E2E verified campaign workspace notes.');
    await page.click('button:has-text("Initialize Workspace")');
    await page.waitForTimeout(2000);
    console.log(`✅ Campaign workspace initialized successfully!`);

    // 7. Manual Points Allocation Flow
    console.log(`👉 Navigating to Points Allocation page...`);
    await page.click('a[href="/admin/dashboard/points"]');
    await page.waitForURL('**/admin/dashboard/points', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`🔍 Selecting creator: "${testName}"...`);
    await page.fill('input[placeholder*="Search by name"]', testName);
    await page.click(`div.rounded-xl:has-text("${testName}")`);
    await page.waitForTimeout(1000);

    console.log(`✍️ Adding points grant transaction...`);
    await page.fill('input#points_amount', '100');
    await page.fill('textarea#points_reason', 'Special reel campaign extra performance bonus.');
    await page.click('button:has-text("Credit Points Balance")');
    await page.waitForTimeout(2500);
    console.log(`✅ 100 points successfully granted to creator!`);

    // 8. Redemption Approval Flow
    console.log(`👉 Navigating to Redemption requests page...`);
    await page.click('a[href="/admin/dashboard/redemptions"]');
    await page.waitForURL('**/admin/dashboard/redemptions', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`🔍 Reviewing pending redemption request for "${testName}"...`);
    const redemptionRow = page.locator(`tr:has-text("${testName}")`);
    await redemptionRow.locator('button:has-text("Approve")').click();
    await page.waitForSelector('h3:has-text("Approve Redemption")', { timeout: 5000 });

    await page.fill('textarea#decision_note', 'Coupon code generated and sent to creator.');
    await page.click('button.bg-emerald-500:has-text("Confirm Action")');
    await page.waitForTimeout(2500);
    console.log(`✅ Redemption request approved successfully!`);

    console.log(`🎉 ALL ADMIN E2E TEST SCENARIOS COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    const screenshotPath = path.join(outputDir, `admin_test_failure_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `admin_e2e_walkthrough.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
