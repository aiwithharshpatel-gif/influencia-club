import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'https://test.influenziaclub.com';
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/f38ce3a5-fab2-49e7-992a-4bcf92088ba1/.system_generated/tasks');

const brandEmail = 'e2e_brand_1781258450000@example.com';
const creatorEmail = 'e2ecreator_1781258450000@example.com';
const creatorPhone = '9999999999';

function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

console.log(`🧪 Starting E2E Automation for Phase 3: Campaign Milestone Deliverables`);
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
      'X-Forwarded-For': generateRandomIP(),
      'x-test-bypass': 'true'
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
        console.log(`[API RESPONSE] ${status} - ${url} => ${text.substring(0, 150)}`);
      } catch (e) {
        // Response body might be empty or unreadable
      }
    }
  });

  // Helper to fetch OTP from API
  async function fetchOTP(email) {
    console.log(`🔍 Querying API endpoint to fetch OTP for ${email}...`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // wait for database write
    const response = await page.request.get(`${targetUrl}/api/auth/latest-otp?email=${email}`, {
      headers: {
        'x-test-bypass': 'true'
      }
    });
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
    // 1. Login as Brand
    console.log(`🌐 Navigating to ${targetUrl}/brand-login...`);
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Requesting login code...`);
    const brandLoginIP = generateRandomIP();
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': brandLoginIP });
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');

    const brandOTP = await fetchOTP(brandEmail);

    console.log(`✍️ Entering OTP and logging in...`);
    await page.fill('input[placeholder="000000"]', brandOTP);
    await page.click('button:has-text("Verify & Log In")');

    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged in to Brand Dashboard! URL: ${page.url()}`);

    // 2. Go to Deliverables page and setup milestones
    console.log(`👉 Navigating to Deliverables management...`);
    await page.click('a[href="/brand/dashboard/milestones"]');
    await page.waitForURL('**/brand/dashboard/milestones', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Navigated to Deliverables page!`);

    // Click on collaboration header for E2E Creator
    console.log(`👉 Expanding collaboration header for E2E Creator...`);
    const collabHeader = page.locator('button:has-text("E2E Creator")').first();
    await collabHeader.click();
    await page.waitForTimeout(2000);

    // Check if we need to create default milestones
    const createBtn = page.locator('button:has-text("Create Default Milestones")');
    if (await createBtn.count() > 0 && await createBtn.isVisible()) {
      console.log(`👉 Milestones not set. Creating Default Milestones...`);
      await createBtn.click();
      await page.waitForTimeout(2000);
      console.log(`✅ Default milestones created!`);
    } else {
      console.log(`👉 Milestones already exist for this collab.`);
    }

    // Expand header again to make sure details are shown
    if (!(await page.locator('text=1. Brief Review').isVisible())) {
      console.log(`👉 Expanding collab header again...`);
      await collabHeader.click();
      await page.waitForTimeout(1000);
    }

    // Verify milestones are displayed
    await page.waitForSelector('text=1. Brief Review', { timeout: 5000 });
    console.log(`✅ Milestones verified on Brand side!`);

    // 3. Logout Brand
    console.log(`👉 Logging out Brand...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Brand logged out!`);

    // 4. Login Creator
    console.log(`🌐 Navigating to ${targetUrl}/login...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Logging in as Creator...`);
    await page.fill('input[placeholder="your@email.com"]', creatorEmail);
    await page.fill('input[placeholder="********"]', creatorPhone);
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged in to Creator Dashboard!`);

    // 5. Go to Milestones page and submit first milestone
    console.log(`👉 Navigating to Creator Milestones page...`);
    await page.click('a[href="/dashboard/milestones"]');
    await page.waitForURL('**/dashboard/milestones', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Navigated to Milestones page!`);

    // Verify Brief Review milestone card is visible and expandable
    console.log(`👉 Checking Brief Review milestone expansion...`);
    const briefCard = page.locator('div.rounded-xl:has(h4:has-text("Brief Review"))');
    const briefInput = briefCard.locator('input[type="url"]');
    
    for (let i = 0; i < 3; i++) {
      if (await briefInput.count() > 0 && await briefInput.isVisible()) {
        console.log(`👉 Brief Review milestone expanded successfully!`);
        break;
      }
      console.log(`👉 Attempt ${i+1}: Clicking Brief Review header...`);
      await briefCard.locator('button').first().click();
      await page.waitForTimeout(1500);
    }

    // Submit deliverable for Brief Review
    console.log(`✍️ Submitting deliverable for Brief Review...`);
    await briefCard.locator('input[type="url"]').fill('https://instagram.com/reel/brief_review_test');
    await briefCard.locator('textarea').fill('Reviewed the brief. Looks great!');
    await briefCard.locator('button:has-text("Submit for Review")').click();

    await page.waitForTimeout(2000);
    console.log(`✅ Brief Review deliverable submitted!`);

    // Logout Creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Creator logged out!`);

    // 6. Login Brand to Approve Brief Review
    console.log(`🌐 Navigating to ${targetUrl}/brand-login...`);
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Requesting login code...`);
    const brandLogin2IP = generateRandomIP();
    await context.setExtraHTTPHeaders({ 'X-Forwarded-For': brandLogin2IP });
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');

    const brandOTP2 = await fetchOTP(brandEmail);

    console.log(`✍️ Entering OTP and logging in...`);
    await page.fill('input[placeholder="000000"]', brandOTP2);
    await page.click('button:has-text("Verify & Log In")');

    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged back in as Brand!`);

    // Go to Deliverables page
    await page.click('a[href="/brand/dashboard/milestones"]');
    await page.waitForURL('**/brand/dashboard/milestones', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Expand collab header
    await page.locator('button:has-text("E2E Creator")').first().click();
    await page.waitForTimeout(2000);

    // Find and click "Review" on the submitted Brief Review milestone
    console.log(`👉 Clicking Review on Brief Review...`);
    const briefRow = page.locator('div.flex:has(div:has-text("1. Brief Review"))');
    await briefRow.locator('button:has-text("Review")').click();
    await page.waitForTimeout(1000);

    // Approve the milestone
    console.log(`✍️ Approving Brief Review...`);
    await page.click('button:has-text("Approve")');
    await page.fill('textarea[placeholder*="Great work!"]', 'Approved! Please proceed to the draft submission.');
    await page.click('button.bg-green-500:has-text("Approve")');

    await page.waitForTimeout(2000);
    console.log(`✅ Brief Review milestone approved!`);

    // Logout Brand
    console.log(`👉 Logging out Brand...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Brand logged out!`);

    // 7. Login Creator to Submit Content Draft
    console.log(`🌐 Navigating to ${targetUrl}/login...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Logging in as Creator...`);
    await page.fill('input[placeholder="your@email.com"]', creatorEmail);
    await page.fill('input[placeholder="********"]', creatorPhone);
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged in to Creator Dashboard!`);

    // Go to Milestones page
    await page.click('a[href="/dashboard/milestones"]');
    await page.waitForURL('**/dashboard/milestones', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify Brief Review shows Approved
    const briefStatus = await page.locator('div.rounded-xl:has(h4:has-text("Brief Review"))').locator('span').first().textContent();
    console.log(`📊 Brief Review Status: ${briefStatus}`);
    if (!briefStatus.toLowerCase().includes('approved')) {
      throw new Error(`Expected Brief Review to be Approved, but got: ${briefStatus}`);
    }

    // Expand the Content Draft milestone (which should now be in progress)
    console.log(`👉 Checking Content Draft milestone expansion...`);
    const draftCard = page.locator('div.rounded-xl:has(h4:has-text("Content Draft"))');
    const draftInput = draftCard.locator('input[type="url"]');
    
    for (let i = 0; i < 3; i++) {
      if (await draftInput.count() > 0 && await draftInput.isVisible()) {
        console.log(`👉 Content Draft milestone expanded successfully!`);
        break;
      }
      console.log(`👉 Attempt ${i+1}: Clicking Content Draft header...`);
      await draftCard.locator('button').first().click();
      await page.waitForTimeout(1500);
    }

    // Submit Content Draft
    console.log(`✍️ Submitting Content Draft...`);
    await draftCard.locator('input[type="url"]').fill('https://instagram.com/reel/content_draft_test');
    await draftCard.locator('textarea').fill('Here is the first draft of the reel. Feedback welcome.');
    await draftCard.locator('button:has-text("Submit for Review")').click();

    await page.waitForTimeout(2000);
    console.log(`✅ Content Draft submitted!`);

    // Logout Creator
    console.log(`👉 Logging out Creator...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Creator logged out!`);

    // 8. Login Brand to Request Revision on Content Draft
    console.log(`🌐 Navigating to ${targetUrl}/brand-login...`);
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Requesting login code...`);
    const brandLogin3IP = generateRandomIP();
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

    // Go to Deliverables page
    await page.click('a[href="/brand/dashboard/milestones"]');
    await page.waitForURL('**/brand/dashboard/milestones', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Expand collab header
    await page.locator('button:has-text("E2E Creator")').first().click();
    await page.waitForTimeout(2000);

    // Find and click "Review" on the submitted Content Draft milestone
    console.log(`👉 Clicking Review on Content Draft...`);
    const draftRow = page.locator('div.flex:has(div:has-text("2. Content Draft"))');
    await draftRow.locator('button:has-text("Review")').click();
    await page.waitForTimeout(1000);

    // Request revision
    console.log(`✍️ Requesting revision on Content Draft...`);
    await page.click('button:has-text("Request Revision")');
    await page.fill('textarea[placeholder*="Please adjust the caption"]', 'Please add the hashtag #AuraStyle and tag us in the reel.');
    await page.click('button.bg-orange-500:has-text("Request Revision")');

    await page.waitForTimeout(2000);
    console.log(`✅ Revision requested on Content Draft!`);

    // Logout Brand
    console.log(`👉 Logging out Brand...`);
    await page.click('button:has-text("Logout")');
    await page.waitForURL(targetUrl, { timeout: 15000 });
    console.log(`✅ Brand logged out!`);

    // 9. Login Creator to Verify Revision Request
    console.log(`🌐 Navigating to ${targetUrl}/login...`);
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`✍️ Logging in as Creator...`);
    await page.fill('input[placeholder="your@email.com"]', creatorEmail);
    await page.fill('input[placeholder="********"]', creatorPhone);
    await page.click('button[type="submit"]:has-text("Sign In")');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Logged back in as Creator!`);

    // Go to Milestones page
    await page.click('a[href="/dashboard/milestones"]');
    await page.waitForURL('**/dashboard/milestones', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Verify Content Draft shows Revision Needed and feedback is visible
    const draftStatus = await page.locator('div.rounded-xl:has(h4:has-text("Content Draft"))').locator('span').first().textContent();
    console.log(`📊 Content Draft Status: ${draftStatus}`);
    if (!draftStatus.toLowerCase().includes('revision')) {
      throw new Error(`Expected Content Draft to need revision, but got: ${draftStatus}`);
    }

    // Expand Content Draft to verify feedback text
    console.log(`👉 Checking Content Draft expansion to verify feedback...`);
    const draftCardVerify = page.locator('div.rounded-xl:has(h4:has-text("Content Draft"))');
    const feedbackTextLocator = draftCardVerify.locator('text=Please add the hashtag #AuraStyle and tag us');
    
    for (let i = 0; i < 3; i++) {
      if (await feedbackTextLocator.count() > 0 && await feedbackTextLocator.isVisible()) {
        console.log(`👉 Feedback text is visible!`);
        break;
      }
      console.log(`👉 Attempt ${i+1}: Clicking Content Draft header for feedback...`);
      await draftCardVerify.locator('button').first().click();
      await page.waitForTimeout(1500);
    }

    const feedbackText = await page.locator('text=Please add the hashtag #AuraStyle and tag us').textContent();
    console.log(`📬 Creator received feedback text: "${feedbackText.trim()}"`);

    console.log(`🎉 ALL PHASE 3 TEST SCENARIOS COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Test failed:`, error);
    const timestamp = Date.now();
    const screenshotPath = path.join(outputDir, `milestones_test_failure_${timestamp}.png`);
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, `milestones_test_${Date.now()}.webm`);
      fs.copyFileSync(videoPath, targetPath);
      console.log(`🎥 Video recording saved to: ${targetPath}`);
    }
  }
})();
