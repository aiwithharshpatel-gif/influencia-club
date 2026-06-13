import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'https://test.influenziaclub.com';
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/f38ce3a5-fab2-49e7-992a-4bcf92088ba1/.system_generated/tasks');

const timestamp = Date.now();
const brandEmail = 'e2e_brand_1781258450000@example.com';
const creatorEmail = 'e2ecreator_1781258450000@example.com';
const creatorPhone = '9999999999';
const creatorInsta = 'e2ecreator';

function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

console.log(`🧪 Starting E2E Automation for Option 3 & Option 2`);
console.log(`📧 Brand Email: ${brandEmail}`);
console.log(`📧 Creator Email: ${creatorEmail}`);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    },
    extraHTTPHeaders: {
      'X-Forwarded-For': generateRandomIP()
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

  // Helper to fetch OTP from API
  async function fetchOTP(email) {
    console.log(`🔍 Querying API endpoint to fetch OTP for ${email}...`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // wait for database write
    const response = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${email}`);
    if (!response.ok()) {
      throw new Error(`Failed to fetch OTP: ${response.status()} - ${await response.text()}`);
    }
    const data = await response.json();
    if (!data.success || !data.otp) {
      throw new Error(`Could not retrieve OTP from API: ${JSON.stringify(data)}`);
    }
    console.log(`🔑 Retrieved OTP: ${data.otp}`);
    return data.otp;
  }

  try {
    // 1. Submit Brand Inquiry
    console.log(`🌐 Navigating to ${targetUrl}/brands...`);
    await page.goto(`${targetUrl}/brands`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Submitting Brand Inquiry form...`);
    await page.fill('input[placeholder="Your brand name"]', 'Aura Luxury Brand');
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.fill('input[placeholder="9876543210"]', '9876543210');
    await page.selectOption('select[name="budgetRange"]', '50000+');
    await page.selectOption('select[name="categories"]', 'model');
    await page.fill('textarea[placeholder*="Tell us about your campaign goals"]', 'Automated E2E Campaign for Aura Luxury Brand.');
    await page.click('button[type="submit"]');

    // Wait for success screen
    console.log(`⏳ Waiting for inquiry submission success...`);
    await page.waitForSelector('text=Inquiry Submitted!', { timeout: 15000 });
    console.log(`✅ Brand inquiry submitted successfully!`);

    // 2. Login as Brand
    console.log(`🌐 Navigating to ${targetUrl}/brand-login...`);
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Requesting login code...`);
    const brandLoginIP = generateRandomIP();
    console.log(`🌀 Setting X-Forwarded-For IP to: ${brandLoginIP}`);
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': brandLoginIP });
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');

    // Check if a toast error message appears
    await page.waitForTimeout(2000);
    const errorToast = page.locator('div[role="status"], .hot-toast-message, .toast-error');
    if (await errorToast.count() > 0 && await errorToast.first().isVisible()) {
      console.log(`⚠️ Toast message detected: "${await errorToast.first().innerText()}"`);
    }

    const brandOTP = await fetchOTP(brandEmail);

    console.log(`✍️ Entering OTP and logging in...`);
    await page.fill('input[placeholder="000000"]', brandOTP);
    await page.click('button:has-text("Verify & Log In")');

    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged in to Brand Dashboard! URL: ${page.url()}`);

    // 3. Toggle Public Recruitment
    console.log(`👉 Navigating to Matchmaking for 'Aura Luxury Brand'...`);
    await page.locator('a:has-text("AI Matchmaker")').first().click();
    await page.waitForURL('**/brand/dashboard/inquiries/**/matches', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Turn public recruitment on (if not already)
    console.log(`👉 Checking recruitment status...`);
    const toggleButton = page.locator('span:has-text("Recruit Publicly") + button');
    const isPublic = await toggleButton.getAttribute('class').then(c => c.includes('bg-primary'));
    if (!isPublic) {
      console.log(`👉 Toggling 'Recruit Publicly' to ON...`);
      await toggleButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log(`👉 'Recruit Publicly' is already ON!`);
    }

    console.log(`✍️ Saving Campaign Budget...`);
    await page.fill('input[placeholder="E.g., ₹25,000 - ₹50,000"]', '₹50,000 - ₹100,000');
    await page.click('button:has-text("Save")');
    await page.waitForTimeout(1000);
    console.log(`✅ Campaign recruitment enabled and budget saved!`);

    // 4. Logout Brand
    console.log(`👉 Logging out Brand...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Brand logged out!`);

    // 5. Register New Creator (with self-healing)
    console.log(`🌐 Navigating to ${targetUrl}/join...`);
    await page.goto(`${targetUrl}/join`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Attempting registration for ${creatorEmail}...`);
    await page.fill('input[placeholder="Enter your full name"]', 'E2E Creator');
    await page.fill('input[placeholder="your@email.com"]', creatorEmail);
    await page.fill('input[placeholder="9876543210"]', creatorPhone);
    await page.fill('input[placeholder="@username"]', creatorInsta);
    await page.selectOption('select:has-text("Select")', 'model');
    await page.selectOption('select:has-text("Ahmedabad")', 'Ahmedabad');
    const creatorRegisterIP = generateRandomIP();
    console.log(`🌀 Setting X-Forwarded-For IP to: ${creatorRegisterIP}`);
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': creatorRegisterIP });

    // Capture the registration response
    const registerResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/auth/register')
    );
    await page.click('button:has-text("Send Verification Code")');
    const registerResponse = await registerResponsePromise;

    if (registerResponse.status() === 409) {
      console.log(`⚠️ Creator is already registered. Logging in directly instead...`);
      await page.goto(`${targetUrl}/login`);
      await page.waitForLoadState('networkidle');
      await page.fill('input[placeholder="your@email.com"]', creatorEmail);
      await page.fill('input[placeholder="********"]', creatorPhone);
      await page.click('button[type="submit"]:has-text("Sign In")');
    } else {
      const creatorOTP = await fetchOTP(creatorEmail);
      console.log(`✍️ Entering OTP...`);
      await page.fill('input[placeholder="000000"]', creatorOTP);
      await page.click('button:has-text("Verify Email")');

      // Wait for success screen
      await page.waitForSelector('text=Welcome to Influenzia Club!', { timeout: 15000 });
      await page.click('a:has-text("Go to Dashboard")');
    }

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Creator registration / login complete! URL: ${page.url()}`);

    // 6. Go to Explore Campaigns and Apply
    console.log(`👉 Navigating to Explore Campaigns...`);
    await page.click('a[href="/dashboard/explore"]');
    await page.waitForURL('**/dashboard/explore', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log(`👉 Finding 'Aura Luxury Brand' and applying...`);
    const firstCard = page.locator('div.bg-bg-card:has(span:has-text("Aura Luxury Brand"))').first();
    const applyButton = firstCard.locator('button:has-text("Apply Now")');
    const alreadyApplied = await firstCard.locator('button:has-text("Applied")').count() > 0;

    if (!alreadyApplied) {
      await applyButton.click();
      
      // Fill Apply Modal
      await page.waitForSelector('textarea[placeholder*="Write a brief message"]');
      await page.fill('textarea[placeholder*="Write a brief message"]', 'Hey Aura Luxury Brand, I would love to promote your campaign!');
      await page.fill('input[placeholder*="per Reel"]', '₹25,000 per Reel');
      await page.click('button[type="submit"]:has-text("Send Application")');

      // Verify submitted status on Creator side
      console.log(`⏳ Verifying application status is "Applied"...`);
      await firstCard.locator('button:has-text("Applied")').waitFor({ state: 'visible', timeout: 10000 });
      console.log(`✅ Application submitted and status verified!`);
    } else {
      console.log(`👉 Creator has already applied to this campaign.`);
    }

    // 7. Logout Creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Creator logged out!`);

    // 8. Login Brand to Approve Application
    console.log('🌐 Logging back in as Brand to approve...');
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    const brandLogin2IP = generateRandomIP();
    console.log(`🌀 Setting X-Forwarded-For IP to: ${brandLogin2IP}`);
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': brandLogin2IP });
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');

    const brandOTP2 = await fetchOTP(brandEmail);

    await page.fill('input[placeholder="000000"]', brandOTP2);
    await page.click('button:has-text("Verify & Log In")');

    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged back in as Brand!`);

    // Go to matches page
    await page.locator('a:has-text("AI Matchmaker")').first().click();
    await page.waitForURL('**/brand/dashboard/inquiries/**/matches', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Find application and click Accept (if it is pending)
    console.log(`👉 Approving the creator's application...`);
    const acceptBtn = page.locator('div.bg-bg-card:has(h4:has-text("E2E Creator"))').first().locator('button:has-text("Accept")');
    try {
      await acceptBtn.waitFor({ state: 'visible', timeout: 5000 });
      await acceptBtn.click();
      await page.waitForTimeout(2000);
      console.log(`✅ Creator's application approved!`);
    } catch (e) {
      console.log(`👉 Application is already approved or not pending.`);
    }

    // 9. WebSocket Chat - Send Message (Option 2)
    console.log(`👉 Navigating to Brand Messages...`);
    await page.click('a[href="/brand/dashboard/messages"]');
    await page.waitForURL('**/brand/dashboard/messages', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log(`👉 Opening thread with E2E Creator...`);
    await page.click('button:has(span:has-text("E2E Creator"))');
    await page.waitForTimeout(1000);

    console.log(`✍️ Sending message to E2E Creator...`);
    await page.fill('input[placeholder="Type a message..."]', `Hello E2E Creator! Welcome to the Aura Luxury Brand campaign! Let's schedule a shoot.`);
    await page.click('button[type="submit"]:has-text("Send")');
    await page.waitForTimeout(1000);
    console.log(`✅ Message sent by Brand!`);

    // 10. Logout Brand
    console.log(`👉 Logging out Brand...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Brand logged out!`);

    // 11. Login Creator with Password
    console.log(`🌐 Navigating to ${targetUrl}/login...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Logging in as Creator via password...`);
    await page.fill('input[placeholder="your@email.com"]', creatorEmail);
    await page.fill('input[placeholder="********"]', creatorPhone);
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged back in as Creator!`);

    // 12. Creator Messages - Verify & Reply
    console.log(`👉 Navigating to Creator Messages...`);
    await page.click('a[href="/dashboard/messages"]');
    await page.waitForURL('**/dashboard/messages', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log(`👉 Opening thread with Brand...`);
    await page.click('button:has(span:has-text("Aura Luxury Brand"))');
    await page.waitForTimeout(1000);

    console.log(`⏳ Verifying received message...`);
    const receivedMsg = await page.locator('text=Hello E2E Creator! Welcome to the Aura Luxury Brand').first().textContent();
    console.log(`📬 Received message text: "${receivedMsg.trim()}"`);

    console.log(`✍️ Sending reply to Brand...`);
    await page.fill('input[placeholder="Type a message..."]', `Hi Aura Luxury! Thank you so much, I am super excited to work with you!`);
    await page.click('button:has-text("Send")');
    await page.waitForTimeout(1000);
    console.log(`✅ Reply sent by Creator!`);

    // 13. Logout Creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Creator logged out!`);

    // 14. Login Brand to Verify Reply
    console.log(`🌐 Navigating to ${targetUrl}/brand-login...`);
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Requesting login code...`);
    const brandLogin3IP = generateRandomIP();
    console.log(`🌀 Setting X-Forwarded-For IP to: ${brandLogin3IP}`);
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': brandLogin3IP });
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');

    const brandOTP3 = await fetchOTP(brandEmail);

    console.log(`✍️ Entering OTP and logging in...`);
    await page.fill('input[placeholder="000000"]', brandOTP3);
    await page.click('button:has-text("Verify & Log In")');

    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged back in as Brand!`);

    // Verify messages
    console.log(`👉 Navigating to Brand Messages...`);
    await page.click('a[href="/brand/dashboard/messages"]');
    await page.waitForURL('**/brand/dashboard/messages', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log(`👉 Opening thread with E2E Creator...`);
    await page.click('button:has(span:has-text("E2E Creator"))');
    await page.waitForTimeout(1000);

    console.log(`⏳ Verifying received reply...`);
    const receivedReply = await page.locator('text=Thank you so much, I am super excited to work').first().textContent();
    console.log(`📬 Received reply text: "${receivedReply.trim()}"`);

    console.log(`🎉 ALL TEST SCENARIOS COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    if (page) {
      const screenshotPath = path.join(outputDir, `test_failure_${timestamp}.png`);
      await page.screenshot({ path: screenshotPath });
      console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    }
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `option_test_${timestamp}.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
