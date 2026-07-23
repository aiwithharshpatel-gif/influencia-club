import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const targetUrl = 'http://localhost:5173';
const apiBaseUrl = 'https://test.influenziaclub.com'; // Point to staging backend for OTP fetching
const outputDir = path.resolve('C:/Users/Harsh patel/.gemini/antigravity-ide/brain/2fa3cf25-00ae-4ccd-b9d6-b344e3e189e7/screenshots');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function generateRandomIP() {
  return `${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;
}

(async () => {
  console.log('🚀 Starting Theme Compatibility Audit Script...');
  const timestamp = Date.now();
  
  const creatorEmail = `theme_creator_test_${timestamp}@example.com`;
  const creatorPhone = `98765${String(timestamp).slice(-5)}`;
  const creatorInsta = `theme_insta_${timestamp}`;
  
  const brandName = `Theme Brand ${timestamp}`;
  const brandEmail = `theme_brand_test_${timestamp}@example.com`;

  // Launch Chromium with disabled web security to bypass CORS
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-web-security']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    extraHTTPHeaders: {
      'X-Forwarded-For': generateRandomIP(),
      'x-test-bypass': 'true'
    }
  });

  const page = await context.newPage();

  // Logging helpers for debugging
  page.on('pageerror', exception => {
    console.log(`❌ [Page Error] ${exception.toString()}`);
  });
  page.on('console', message => {
    if (message.type() === 'error') {
      console.log(`❌ [Browser Console Error] ${message.text()}`);
    } else {
      console.log(`💬 [Browser Console] ${message.text()}`);
    }
  });
  page.on('response', async (response) => {
    if (response.url().includes('/api/')) {
      try {
        const text = await response.text();
        console.log(`📡 [API RESPONSE] ${response.status()} - ${response.url()} => ${text.substring(0, 150)}`);
      } catch (e) {}
    }
  });

  // Helper to fetch OTP from staging backend
  async function fetchOTP(email) {
    console.log(`🔍 Querying Staging API for OTP of ${email}...`);
    // Wait a bit for db sync
    await new Promise(resolve => setTimeout(resolve, 4000));
    const response = await page.request.get(`${apiBaseUrl}/api/auth/latest-otp?email=${email}`, {
      headers: { 'x-test-bypass': 'true' }
    });
    if (!response.ok()) {
      throw new Error(`Failed to fetch OTP: ${response.status()} - ${await response.text()}`);
    }
    const data = await response.json();
    if (!data.success || !data.otp) {
      throw new Error(`Could not retrieve OTP: ${JSON.stringify(data)}`);
    }
    console.log(`🔑 Retrieved OTP: ${data.otp}`);
    return data.otp;
  }

  // Helper to toggle theme and take screenshots
  async function captureThemeScreens(pageName, urlPath = null) {
    if (urlPath) {
      console.log(`🌐 Navigating to ${targetUrl}${urlPath}...`);
      await page.goto(`${targetUrl}${urlPath}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    // Capture Dark Mode
    console.log(`📸 Capturing [Dark Mode] for ${pageName}...`);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('influenzia_theme', 'dark');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, `${pageName}_dark.png`), fullPage: true });

    // Capture Light Mode
    console.log(`📸 Capturing [Light Mode] for ${pageName}...`);
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('influenzia_theme', 'light');
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outputDir, `${pageName}_light.png`), fullPage: true });
  }

  try {
    // ----------------------------------------------------
    // PHASE 1: Public Pages
    // ----------------------------------------------------
    console.log('\n--- Auditing Public Pages ---');
    await captureThemeScreens('01_home', '/');
    await captureThemeScreens('02_about', '/about');
    await captureThemeScreens('03_creators', '/creators');
    await captureThemeScreens('04_join', '/join');
    await captureThemeScreens('05_brands', '/brands');
    await captureThemeScreens('06_contact', '/contact');
    await captureThemeScreens('07_login', '/login');
    await captureThemeScreens('08_leaderboard', '/leaderboard');
    await captureThemeScreens('09_privacy', '/privacy');
    await captureThemeScreens('10_terms', '/terms');

    // ----------------------------------------------------
    // PHASE 2: Creator Registration & Dashboard Pages (Instagram SSO)
    // ----------------------------------------------------
    console.log('\n--- Registering & Auditing Creator Pages (Instagram SSO) ---');
    await page.goto(`${targetUrl}/login`);
    await page.waitForLoadState('networkidle');

    console.log(`👉 Clicking 'Login with Instagram'...`);
    const [loginPopup] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Login with Instagram")')
    ]);

    await loginPopup.waitForLoadState('networkidle');
    console.log(`✅ Login Popup opened! Authorizing @${creatorInsta}...`);
    await loginPopup.fill('input[placeholder="username"]', creatorInsta);
    await loginPopup.click('button:has-text("Authorize & Connect")');

    console.log(`⏳ Waiting for redirection to /join page...`);
    await page.waitForURL('**/join?handle=*', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // wait for pre-fill useEffect

    console.log(`✍️ Filling remaining registration form fields...`);
    await page.fill('input[placeholder="your@email.com"]', creatorEmail);
    await page.fill('input[placeholder="9876543210"]', creatorPhone);
    await page.selectOption('select:has-text("Select")', 'influencer');
    await page.selectOption('select:has-text("Ahmedabad")', 'Ahmedabad');

    console.log(`👉 Submitting completed form...`);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ Logged in to Creator Dashboard!');

    // Capture Creator Dashboard views
    await captureThemeScreens('11_creator_overview', '/dashboard');
    await captureThemeScreens('12_creator_profile', '/dashboard/profile');
    await captureThemeScreens('13_creator_referrals', '/dashboard/referrals');
    await captureThemeScreens('14_creator_points', '/dashboard/points');
    await captureThemeScreens('15_creator_collabs', '/dashboard/collabs');
    await captureThemeScreens('16_creator_messages', '/dashboard/messages');
    await captureThemeScreens('17_creator_explore', '/dashboard/explore');
    await captureThemeScreens('18_creator_milestones', '/dashboard/milestones');

    // Logout Creator
    console.log('👉 Logging out Creator...');
    await page.goto(`${targetUrl}/dashboard`);
    await page.waitForLoadState('networkidle');
    const logoutBtn = page.locator('button:has-text("Logout"), button:has-text("LogOut")');
    if (await logoutBtn.count() > 0) {
      await logoutBtn.first().click();
    } else {
      await page.goto(`${targetUrl}/login`);
    }
    await page.waitForURL(targetUrl, { timeout: 10000 });

    // ----------------------------------------------------
    // PHASE 3: Brand Inquiry & Dashboard Pages
    // ----------------------------------------------------
    console.log('\n--- Submitting Brand Inquiry & Auditing Brand Pages ---');
    console.log('📤 Submitting Brand Inquiry...');
    const inquiryResponse = await page.request.post(`${apiBaseUrl}/api/inquiries`, {
      headers: { 'x-test-bypass': 'true' },
      data: {
        brandName,
        email: brandEmail,
        mobile: '9876543210',
        budgetRange: '15000-30000',
        categories: ['influencer'],
        message: 'Theme verification company inquiry.'
      }
    });
    if (!inquiryResponse.ok()) {
      throw new Error(`Failed to submit brand inquiry: ${inquiryResponse.status()} - ${await inquiryResponse.text()}`);
    }
    console.log('✅ Brand inquiry submitted!');

    // Brand Login
    await page.goto(`${targetUrl}/brand-login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input[placeholder="brand@company.com"]', brandEmail);
    await page.click('button:has-text("Get Login Code")');
    
    await page.waitForSelector('input[placeholder="000000"]', { timeout: 15000 });
    const brandOTP = await fetchOTP(brandEmail);
    await page.fill('input[placeholder="000000"]', brandOTP);
    await page.click('button:has-text("Verify & Log In")');
    
    await page.waitForURL('**/brand/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Capture Brand Dashboard views
    await captureThemeScreens('19_brand_overview', '/brand/dashboard');
    await captureThemeScreens('20_brand_creators', '/brand/dashboard/creators');
    await captureThemeScreens('21_brand_analytics', '/brand/dashboard/analytics');
    await captureThemeScreens('22_brand_messages', '/brand/dashboard/messages');
    await captureThemeScreens('23_brand_milestones', '/brand/dashboard/milestones');

    // Logout Brand
    console.log('👉 Logging out Brand...');
    const brandLogoutBtn = page.locator('button:has-text("Logout"), button:has-text("LogOut")');
    if (await brandLogoutBtn.count() > 0) {
      await brandLogoutBtn.first().click();
    }
    await page.waitForURL('**/brand-login', { timeout: 10000 });


    // ----------------------------------------------------
    // PHASE 4: Admin Dashboard Pages
    // ----------------------------------------------------
    console.log('\n--- Auditing Admin Pages ---');
    await page.goto(`${targetUrl}/admin-login`);
    await page.waitForLoadState('networkidle');
    await page.fill('input#admin_email', 'admin@influenziaclub.com');
    await page.fill('input#admin_password', 'Influenzia@2026');
    await page.click('button#admin_login_submit');
    
    await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Capture Admin Dashboard views
    await captureThemeScreens('24_admin_overview', '/admin/dashboard');
    await captureThemeScreens('25_admin_creators', '/admin/dashboard/creators');
    await captureThemeScreens('26_admin_inquiries', '/admin/dashboard/inquiries');
    await captureThemeScreens('27_admin_redemptions', '/admin/dashboard/redemptions');
    await captureThemeScreens('28_admin_points', '/admin/dashboard/points');

    console.log('\n🎉 Theme Compatibility Audit Complete! All screenshots captured.');

  } catch (error) {
    console.error('❌ Error occurred during automation:', error);
  } finally {
    await browser.close();
  }
})();
