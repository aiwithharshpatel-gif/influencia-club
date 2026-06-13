import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'https://test.influenziaclub.com';
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/f38ce3a5-fab2-49e7-992a-4bcf92088ba1');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

(async () => {
  const timestamp = Date.now();
  const testEmail = `test_rewards_creator_${timestamp}@example.com`;
  const testName = `Test Rewards Creator ${timestamp}`;
  const testPhone = `98765${String(timestamp).slice(-5)}`;
  const testInsta = `test_rewards_insta_${timestamp}`;

  console.log(`🧪 Starting Phase 2 Points & Rewards E2E Test`);
  console.log(`📧 Test Email: ${testEmail}`);
  console.log(`🔗 Target URL: ${targetUrl}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  // Log all API responses for debugging
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      try {
        const status = response.status();
        const url = response.url();
        const text = await response.text();
        console.log(`[API RESPONSE] ${status} - ${url} => ${text}`);
      } catch (e) {
        // Response body might be empty or unreadable
      }
    }
  });

  try {
    // 1. Visit Join Page
    console.log(`🌐 Navigating to ${targetUrl}/join...`);
    await page.goto(`${targetUrl}/join`);
    await page.waitForLoadState('networkidle');

    // 2. Fill registration form
    console.log(`✍️ Filling registration form...`);
    await page.fill('input[placeholder="Enter your full name"]', testName);
    await page.fill('input[placeholder="your@email.com"]', testEmail);
    await page.fill('input[placeholder="9876543210"]', testPhone);
    await page.fill('input[placeholder="@username"]', testInsta);
    await page.selectOption('select:has-text("Select")', 'influencer');
    await page.selectOption('select:has-text("Ahmedabad")', 'Ahmedabad');
    
    console.log(`👉 Clicking 'Send Verification Code'...`);
    await page.click('button:has-text("Send Verification Code")');

    // 3. Wait for OTP screen
    console.log(`⏳ Waiting for OTP input screen...`);
    await page.waitForSelector('input[placeholder="000000"]', { timeout: 15000 });
    console.log(`✅ OTP screen loaded!`);

    // 4. Query OTP from backend API
    console.log(`🔍 Querying API to fetch OTP for ${testEmail}...`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // wait for DB write
    
    const otpResponse = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${testEmail}`);
    if (!otpResponse.ok()) {
      throw new Error(`Failed to fetch OTP: ${otpResponse.status()} - ${await otpResponse.text()}`);
    }
    const otpData = await otpResponse.json();
    if (!otpData.success || !otpData.otp) {
      throw new Error(`Could not retrieve OTP: ${JSON.stringify(otpData)}`);
    }

    const otp = otpData.otp;
    console.log(`🔑 Retrieved OTP: ${otp}`);

    // 5. Submit OTP
    await page.fill('input[placeholder="000000"]', otp);
    await page.click('button:has-text("Verify Email")');

    // 6. Wait for success screen & redirect
    await page.waitForSelector('text=Welcome to Influenzia Club!', { timeout: 10000 });
    console.log(`✅ Registration completed successfully!`);

    await page.click('a:has-text("Go to Dashboard")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log(`📍 Current URL: ${page.url()}`);

    // 7. Check current points balance and tier in overview page
    console.log(`📊 Verifying stats on Overview Page...`);
    const pointsStatValue = await page.locator('div.bg-bg-card:has-text("Points Balance (Silver Tier)") >> div.text-3xl').textContent();
    console.log(`👀 Overview stat value: "${pointsStatValue.trim()}"`);

    if (parseInt(pointsStatValue.trim()) !== 10) {
      throw new Error(`Expected initial points balance of 10, got ${pointsStatValue}`);
    }
    console.log(`✅ Initial balance is 10 and tier is Silver!`);

    // 8. Go to Points page
    console.log(`🌐 Navigating to Points Marketplace...`);
    await page.click('a:has-text("Points")');
    await page.waitForURL('**/dashboard/points', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log(`📍 Current URL: ${page.url()}`);

    // Verify Points Marketplace headers
    const marketplaceHeader = await page.locator('h1').textContent();
    console.log(`🏷️ Page Heading: "${marketplaceHeader.trim()}"`);

    // Check available balance and tier indicator
    const pointsBalance = await page.locator('text=Available Balance >> xpath=.. >> div.text-4xl').textContent();
    const tierBadge = await page.locator('text=Current Tier >> xpath=.. >> span.rounded-full').textContent();
    console.log(`💰 Available Balance: "${pointsBalance.trim()}"`);
    console.log(`🏅 Tier Badge text: "${tierBadge.trim()}"`);

    if (!pointsBalance.includes('10')) {
      throw new Error(`Expected balance 10 in marketplace, got "${pointsBalance}"`);
    }
    if (tierBadge.trim().toLowerCase() !== 'silver') {
      throw new Error(`Expected tier Silver in marketplace, got "${tierBadge}"`);
    }
    console.log(`✅ Silver tier and 10 pts verified in Points Marketplace UI!`);

    // 9. Grant points via secure test endpoint using page request
    console.log(`🚀 Sending test-grant request to backend...`);
    const grantResponse = await page.request.post(`${targetUrl}/api/rewards/test-grant`, {
      data: {
        secret: 'change_this_to_a_random_64_character_secret',
        points: 300
      }
    });

    if (!grantResponse.ok()) {
      throw new Error(`Failed to grant points: ${grantResponse.status()} - ${await grantResponse.text()}`);
    }
    const grantData = await grantResponse.json();
    console.log(`🎉 Granted points response:`, grantData);

    // 10. Reload the Points Marketplace page to see updates
    console.log(`🔄 Reloading Points page to verify tier elevation...`);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Check updated balance and tier
    const updatedBalance = await page.locator('text=Available Balance >> xpath=.. >> div.text-4xl').textContent();
    const updatedTierBadge = await page.locator('text=Current Tier >> xpath=.. >> span.rounded-full').textContent();
    console.log(`💰 Updated Balance: "${updatedBalance.trim()}"`);
    console.log(`🏅 Updated Tier Badge: "${updatedTierBadge.trim()}"`);

    if (!updatedBalance.includes('310')) {
      throw new Error(`Expected balance 310, got "${updatedBalance}"`);
    }
    if (updatedTierBadge.trim().toLowerCase() !== 'gold') {
      throw new Error(`Expected tier Gold, got "${updatedTierBadge}"`);
    }
    console.log(`✅ Tier successfully elevated to GOLD with 310 points!`);

    // 11. Redeem a reward (Instagram Boost Promotion - 250 points)
    console.log(`🎁 Redeeming 'Instagram Boost Promotion' (250 pts)...`);
    // Find the button inside the card for Instagram promotion
    const redeemButton = page.locator('div.group:has-text("Instagram Boost Promotion") >> button:has-text("Redeem Reward")');
    await redeemButton.click();

    // 12. Verify success message and balance deduction
    console.log(`⏳ Waiting for redemption success message...`);
    await page.waitForSelector('text=Redemption request submitted successfully', { timeout: 15000 });
    console.log(`✅ Success message shown!`);

    // Verify balance deduction on UI
    await page.waitForSelector('text=Available Balance >> xpath=.. >> :has-text("60")', { timeout: 10000 });
    const finalBalance = await page.locator('text=Available Balance >> xpath=.. >> div.text-4xl').textContent();
    const finalTierBadge = await page.locator('text=Current Tier >> xpath=.. >> span.rounded-full').textContent();
    console.log(`💰 Final Balance: "${finalBalance.trim()}"`);
    console.log(`🏅 Final Tier: "${finalTierBadge.trim()}"`);

    if (!finalBalance.includes('60')) {
      throw new Error(`Expected balance 60 after deduction (310 - 250), got "${finalBalance}"`);
    }
    if (finalTierBadge.trim().toLowerCase() !== 'gold') {
      throw new Error(`Expected tier to remain Gold, got "${finalTierBadge}"`);
    }
    console.log(`✅ Points balance deducted to 60 pts, tier remains Gold!`);

    // 13. Verify redemption request shows up in the lists
    console.log(`📋 Verifying Redemption Requests list...`);
    const redemptionItem = page.locator('div.rounded-xl:has-text("ig promo")').first();
    const statusText = await redemptionItem.locator('span').textContent();
    console.log(`📝 List Status: "${statusText.trim()}"`);

    if (statusText.trim().toLowerCase() !== 'pending') {
      throw new Error(`Expected redemption request status to be pending, got "${statusText}"`);
    }
    console.log(`✅ E2E validation completed successfully!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    const screenshotPath = path.join(outputDir, `rewards_test_failure_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `rewards_e2e_walkthrough.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
