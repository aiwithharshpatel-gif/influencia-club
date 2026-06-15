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
  const testEmail = `e2e_creator_pay_${timestamp}@example.com`;
  const testName = `E2E Creator PayTest ${timestamp}`;
  const testPhone = `88888${String(timestamp).slice(-5)}`;
  const testInsta = `e2e_insta_pay_${timestamp}`;
  const brandName = `E2E Pay Brand ${timestamp}`;
  const brandEmail = `e2e_brand_pay_${timestamp}@example.com`;

  console.log(`🧪 Starting Payments & Payouts E2E Test Suite`);
  console.log(`📧 Creator Email: ${testEmail}`);
  console.log(`🏢 Brand Email: ${brandEmail}`);
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
    // 1. Submit Brand Inquiry
    // ═══════════════════════════════════════════════════════════════════
    console.log(`📤 Submitting Brand Inquiry for ${brandName}...`);
    const inquiryResponse = await page.request.post(`${targetUrl}/api/inquiries`, {
      headers: { 'x-test-bypass': 'true' },
      data: {
        brandName,
        email: brandEmail,
        mobile: '9876543210',
        budgetRange: '15000-30000',
        categories: ['influencer'],
        message: 'Escrow payment and payouts E2E campaign.'
      }
    });

    if (!inquiryResponse.ok()) {
      throw new Error(`Failed to submit brand inquiry: ${inquiryResponse.status()} - ${await inquiryResponse.text()}`);
    }
    console.log(`✅ Brand inquiry submitted!`);

    // ═══════════════════════════════════════════════════════════════════
    // 2. Creator Registration
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
    console.log(`✅ OTP screen loaded!`);

    // Fetch OTP
    console.log(`🔍 Fetching OTP for ${testEmail}...`);
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
    console.log(`✅ Creator Registration completed!`);

    await page.click('a:has-text("Go to Dashboard")');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Logout Creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Creator logged out!`);

    // ═══════════════════════════════════════════════════════════════════
    // 3. Admin Match & Campaign Workspace Launch
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🌐 Navigating to ${targetUrl}/admin-login...`);
    await page.goto(`${targetUrl}/admin-login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input#admin_email', 'admin@influenziaclub.com');
    await page.fill('input#admin_password', 'Admin@12345');
    await page.click('button#admin_login_submit');

    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Admin logged in!`);

    // Approve & Verify Creator
    console.log(`👉 Navigating to Creators Directory...`);
    await page.click('a[href="/admin/dashboard/creators"]');
    await page.waitForURL('**/admin/dashboard/creators', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`🔍 Searching for creator: "${testName}"...`);
    await page.fill('input[placeholder*="Search creator name"]', testName);
    await page.click('button:has-text("Filter Directory")');
    await page.waitForTimeout(2000);

    const creatorRow = page.locator(`tr:has-text("${testName}")`);
    const approveBtn = creatorRow.locator('button:has-text("Approve")');
    if (await approveBtn.count() > 0 && await approveBtn.isVisible()) {
      await approveBtn.click();
      await page.waitForTimeout(2000);
      console.log(`✅ Creator approved by admin!`);
    }

    await creatorRow.locator('button:has-text("Verify")').click();
    await page.waitForTimeout(2000);
    console.log(`✅ Creator verified by admin!`);

    // Brand Inquiry Lifecycle Matching
    console.log(`👉 Navigating to Brand Inquiries page...`);
    await page.click('a[href="/admin/dashboard/inquiries"]');
    await page.waitForURL('**/admin/dashboard/inquiries', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    console.log(`🔍 Selecting inquiry for "${brandName}"...`);
    const inquiryCard = page.locator(`div.rounded-xl:has-text("${brandName}")`);
    await inquiryCard.click();
    await page.waitForTimeout(1000);

    console.log(`✍️ Matching creator...`);
    await page.selectOption('select#inq_package_select', 'growth');
    await page.waitForTimeout(1000);
    await page.selectOption('select#inq_creator_select', { label: `${testName} (@${testInsta})` });
    await page.waitForTimeout(1000);
    await page.selectOption('select#inq_status_select', 'in_progress');
    await page.waitForTimeout(1500);

    console.log(`🚀 Initializing Campaign Workspace...`);
    await page.click('button:has-text("Create Campaign Workspace")');
    await page.waitForSelector('h3:has-text("Launch Campaign Workspace")', { timeout: 5000 });

    await page.fill('input#campaign_start', '2026-07-01');
    await page.fill('input#campaign_end', '2026-07-31');
    await page.fill('textarea#campaign_notes', 'E2E verified campaign workspace notes.');
    await page.click('button:has-text("Initialize Workspace")');
    await page.waitForTimeout(2000);
    console.log(`✅ Campaign workspace launched!`);

    // Logout Admin
    console.log(`👉 Logging out Admin...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });

    // ═══════════════════════════════════════════════════════════════════
    // 4. Brand Portal Login & Escrow Checkout Simulation
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🌐 Navigating to Brand Login...`);
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Submitting Brand email: ${brandEmail}...`);
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');

    console.log(`⏳ Waiting for OTP screen...`);
    await page.waitForSelector('input[placeholder="000000"]', { timeout: 15000 });

    console.log(`🔍 Fetching OTP for Brand...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const brandOtpRes = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${brandEmail}`, {
      headers: { 'x-test-bypass': 'true' }
    });
    if (!brandOtpRes.ok()) {
      throw new Error(`Failed to fetch Brand OTP: ${brandOtpRes.status()}`);
    }
    const brandOtpData = await brandOtpRes.json();
    const brandOtp = brandOtpData.otp;
    console.log(`🔑 Brand OTP: ${brandOtp}`);

    await page.fill('input[placeholder="000000"]', brandOtp);
    await page.click('button:has-text("Verify & Log In")');

    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Brand logged in!`);

    // Expand deliverables and create milestones if needed
    console.log(`👉 Navigating to Brand Deliverables/Milestones page...`);
    await page.click('a:has-text("Deliverables")');
    await page.waitForLoadState('networkidle');

    console.log(`🔍 Expanding collaboration with ${testName}...`);
    const collabHeader = page.locator(`button:has-text("${testName}")`);
    await collabHeader.click();
    await page.waitForTimeout(2000);

    // If "Create Default Milestones" is visible, click it
    const createMilestonesBtn = page.locator('button:has-text("Create Default Milestones")');
    if (await createMilestonesBtn.count() > 0 && await createMilestonesBtn.isVisible()) {
      console.log(`👉 Creating default milestones...`);
      await createMilestonesBtn.click();
      await page.waitForTimeout(2000);
      // Re-expand
      await collabHeader.click();
      await page.waitForTimeout(2000);
    }

    // Perform Escrow Payment
    console.log(`💳 Click Pay Escrow...`);
    const payEscrowBtn = page.locator('button:has-text("Pay Escrow")');
    await payEscrowBtn.click();
    await page.waitForSelector('h3:has-text("Escrow Payment Checkout")', { timeout: 5000 });

    console.log(`✍️ Filling amount and simulated payment...`);
    await page.fill('input#escrow-payment-amount-input', '5000');
    await page.click('button#simulate-payment-btn');

    console.log(`⏳ Waiting for payment verification to complete...`);
    await page.waitForSelector('text=Escrow payment simulated successfully!', { timeout: 15000 });
    console.log(`✅ Payment simulation complete!`);

    // Check elements are present after successful payment
    await page.waitForSelector('text=Escrow Payment Protected', { timeout: 5000 });
    const downloadInvoiceBtn = page.locator('button:has-text("Download Invoice")');
    const viewAgreementBtn = page.locator('button:has-text("View Agreement")');
    
    if (await downloadInvoiceBtn.count() === 0 || await viewAgreementBtn.count() === 0) {
      throw new Error("Invoice or Agreement buttons not visible after successful payment!");
    }
    console.log(`✅ Invoice and Agreement actions successfully rendered!`);

    // Test View Agreement Modal
    console.log(`📝 Testing View Agreement Modal...`);
    await viewAgreementBtn.click();
    await page.waitForSelector('h3:has-text("Digital Campaign Agreement")', { timeout: 5000 });
    await page.click('button#close-agreement-modal');
    console.log(`✅ Agreement modal successfully tested!`);

    // Logout Brand
    console.log(`👉 Logging out Brand...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });

    // ═══════════════════════════════════════════════════════════════════
    // 5. Creator Login & UPI Payout Center
    // ═══════════════════════════════════════════════════════════════════
    console.log(`🌐 Navigating to Creator Login...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    await page.fill('input#email', testEmail);
    await page.click('button:has-text("Send Verification Code")');
    
    console.log(`⏳ Waiting for OTP screen...`);
    await page.waitForSelector('input[placeholder="000000"]', { timeout: 15000 });

    console.log(`🔍 Fetching OTP for Creator...`);
    await new Promise(resolve => setTimeout(resolve, 3000));
    const creatorOtpRes = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${testEmail}`, {
      headers: { 'x-test-bypass': 'true' }
    });
    if (!creatorOtpRes.ok()) {
      throw new Error(`Failed to fetch Creator OTP: ${creatorOtpRes.status()}`);
    }
    const creatorOtpData = await creatorOtpRes.json();
    const creatorOtp = creatorOtpData.otp;
    console.log(`🔑 Creator OTP: ${creatorOtp}`);

    await page.fill('input[placeholder="000000"]', creatorOtp);
    await page.click('button:has-text("Verify Email")');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Creator logged in!`);

    // Elevate Creator points
    console.log(`🚀 Elevating creator points...`);
    const pointsGrantResponse = await page.request.post(`${targetUrl}/api/rewards/test-grant`, {
      headers: { 'x-test-bypass': 'true' },
      data: {
        secret: 'change_this_to_a_random_64_character_secret',
        points: 500
      }
    });

    if (!pointsGrantResponse.ok()) {
      throw new Error(`Failed to grant points: ${pointsGrantResponse.status()}`);
    }
    console.log(`✅ Creator points elevated!`);

    // Go to Points Page
    console.log(`🌐 Navigating to Points Marketplace...`);
    await page.click('a:has-text("Points")');
    await page.waitForURL('**/dashboard/points', { timeout: 10000 });
    await page.waitForLoadState('networkidle');

    // Switch to UPI Payout Center Tab
    console.log(`💳 Switching to UPI Payout Center Tab...`);
    await page.click('button#tab-upi-payout');
    await page.waitForSelector('h3:has-text("Withdraw Earnings")', { timeout: 5000 });

    // Request Payout
    console.log(`✍️ Submitting Payout request...`);
    await page.fill('input#payout-amount-input', '200');
    await page.fill('input#payout-upi-input', 'e2epayout@okaxis');
    await page.click('button#submit-payout-btn');

    // Verify Payout request appears in history
    console.log(`⏳ Waiting for payout success banner...`);
    await page.waitForSelector('text=Payout request submitted successfully!', { timeout: 15000 });
    console.log(`✅ Payout request submitted!`);

    // Verify history log entry
    console.log(`🔍 Checking Payout History list...`);
    await page.waitForSelector('div#payout-history-list >> text=UPI: e2epayout@okaxis', { timeout: 5000 });
    console.log(`✅ Payout successfully recorded in Payout History!`);

    console.log(`🎉 ALL ESCROW PAYMENTS & UPI PAYOUTS E2E TEST SCENARIOS COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    const screenshotPath = path.join(outputDir, `payments_test_failure_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } finally {
    const video = page.video();
    await context.close();
    browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `payments_e2e_walkthrough.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
