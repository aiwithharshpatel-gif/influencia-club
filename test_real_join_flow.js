import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'https://test.influenziaclub.com';
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/4446771d-1d86-4bea-ad47-42095f978c80/scratch');

(async () => {
  const timestamp = Date.now();
  const testEmail = `test_creator_${timestamp}@example.com`;
  const testName = `Test Creator ${timestamp}`;
  const testPhone = `98765${String(timestamp).slice(-5)}`;
  const testInsta = `test_insta_${timestamp}`;

  console.log(`🧪 Starting Real Join Flow Test`);
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

  try {
    // 1. Visit Join Page
    console.log(`🌐 Navigating to ${targetUrl}/join...`);
    await page.goto(`${targetUrl}/join`);
    await page.waitForLoadState('networkidle');

    // 2. Fill out the form
    console.log(`✍️ Filling registration form...`);
    await page.fill('input[placeholder="Enter your full name"]', testName);
    await page.fill('input[placeholder="your@email.com"]', testEmail);
    await page.fill('input[placeholder="9876543210"]', testPhone);
    await page.fill('input[placeholder="@username"]', testInsta);
    await page.selectOption('select:has-text("Select")', 'influencer');
    await page.selectOption('select:has-text("Ahmedabad")', 'Ahmedabad');
    
    // Check if there is a password field (should be none since it defaults to phone number)
    const passwordField = await page.locator('input[type="password"]').count();
    if (passwordField > 0) {
      await page.fill('input[type="password"]', 'Password@123');
    }

    // 3. Click "Send Verification Code"
    console.log(`👉 Clicking 'Send Verification Code'...`);
    await page.click('button:has-text("Send Verification Code")');

    // 4. Wait for OTP screen
    console.log(`⏳ Waiting for OTP input screen to load...`);
    await page.waitForSelector('input[placeholder="000000"]', { timeout: 15000 });
    console.log(`✅ OTP screen loaded!`);

    // 5. Query the /latest-otp endpoint to retrieve OTP
    console.log(`🔍 Querying API endpoint to fetch OTP for ${testEmail}...`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // wait a bit for database write
    
    const response = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${testEmail}`);
    if (!response.ok()) {
      throw new Error(`Failed to fetch OTP: ${response.status()} - ${await response.text()}`);
    }
    const data = await response.json();
    if (!data.success || !data.otp) {
      throw new Error(`Could not retrieve OTP from API: ${JSON.stringify(data)}`);
    }

    const otp = data.otp;
    console.log(`🔑 Retrieved OTP: ${otp}`);

    // 6. Enter OTP
    console.log(`✍️ Entering OTP into the form...`);
    await page.fill('input[placeholder="000000"]', otp);

    // 7. Click "Verify Email"
    console.log(`👉 Clicking 'Verify Email'...`);
    await page.click('button:has-text("Verify Email")');

    // 8. Wait for Success screen
    console.log(`⏳ Waiting for success message...`);
    await page.waitForSelector('text=Welcome to Influenzia Club!', { timeout: 10000 });
    console.log(`✅ Success message visible on screen!`);

    // 9. Click "Go to Dashboard"
    console.log(`👉 Clicking 'Go to Dashboard'...`);
    await page.click('a:has-text("Go to Dashboard")');

    // 10. Wait for Dashboard to load
    console.log(`⏳ Waiting for dashboard load...`);
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    console.log(`📍 Current URL: ${page.url()}`);

    // Check if the dashboard has the user's name
    const heading = await page.locator('h1').textContent();
    console.log(`👋 Dashboard Heading text: "${heading.trim()}"`);

    if (page.url().includes('/dashboard')) {
      console.log(`🎉 SUCCESS! Entire Join Flow tested end-to-end and works perfectly!`);
    } else {
      console.log(`❌ Failed: Redirection did not lead to dashboard.`);
    }

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    const screenshotPath = path.join(outputDir, `test_failure_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `real_join_flow_test_${timestamp}.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
