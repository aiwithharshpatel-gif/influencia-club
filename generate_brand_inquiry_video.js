/**
 * Influenzia Club - Brand Inquiry Journey Demo Video Generator
 * Powered by Playwright (v1.60.0)
 *
 * Records a cinematic walkthrough of the Brand Inquiry flow:
 * 1. Home page hero animations
 * 2. Navigate to Brands page via navbar
 * 3. Scroll through hero section & reason cards
 * 4. Showcase pricing tiers (Basic, Growth, Premium) with hover effects
 * 5. Fill the brand inquiry form with organic typing
 * 6. Mock API submission & capture success screen
 * 7. Scroll back to hero for a clean ending
 *
 * Usage:
 *   node generate_brand_inquiry_video.js [target_url]
 *   Example: node generate_brand_inquiry_video.js https://test.influenziaclub.com
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// ── Configuration ──────────────────────────────────────────────────────────────
const targetUrl = process.argv[2] || 'https://test.influenziaclub.com';
const outputDir = path.resolve('./demo-videos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`🚀 Starting Influenzia Club — Brand Inquiry Journey Video Generator`);
console.log(`🔗 Target URL: ${targetUrl}`);
console.log(`📂 Output Directory: ${outputDir}\n`);

(async () => {
  // ── Launch browser ─────────────────────────────────────────────────────────
  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // ── API Interception ───────────────────────────────────────────────────────
  // Mock the /api/inquiries POST so the success screen renders without a real backend
  console.log(`📡 Setting up API route interception for /api/inquiries...`);

  await page.route('**/api/inquiries', async (route, request) => {
    if (request.method() === 'POST') {
      console.log(`   ✅ Intercepted POST /api/inquiries — returning mock success`);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Inquiry submitted successfully',
          inquiry: {
            id: 'mock-inq-brand-001',
            brandName: 'Aura Luxury Group',
            status: 'pending',
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // ── Visual Helpers ─────────────────────────────────────────────────────────

  /**
   * Injects golden cursor overlay, scrollbar hiding CSS, and click-ripple
   * animations into the current page. Must be re-called after every navigation.
   */
  async function injectVisualHelpers() {
    // CSS: Hide scrollbars + golden cursor styles + click ripple keyframes
    await page.addStyleTag({
      content: `
        /* ── Hide Scrollbars ───────────────────────────────────── */
        body, html {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }

        /* ── Golden Cursor Overlay ─────────────────────────────── */
        #playwright-gold-cursor {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.65);
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8),
                      0 0 20px rgba(212, 175, 55, 0.4);
          pointer-events: none;
          z-index: 999999;
          transform: translate(-50%, -50%);
          transition: transform 0.1s cubic-bezier(0.25, 1, 0.5, 1),
                      background-color 0.15s,
                      width 0.15s,
                      height 0.15s;
        }
        #playwright-gold-cursor.clicking {
          width: 28px;
          height: 28px;
          background: rgba(212, 175, 55, 0.9);
          transform: translate(-50%, -50%) scale(0.85);
          box-shadow: 0 0 15px rgba(212, 175, 55, 1),
                      0 0 30px rgba(212, 175, 55, 0.7);
        }

        /* ── Click Ripple Ring ─────────────────────────────────── */
        .click-ripple {
          position: absolute;
          border: 2px solid rgba(212, 175, 55, 0.8);
          border-radius: 50%;
          pointer-events: none;
          z-index: 999998;
          transform: translate(-50%, -50%);
          animation: ripple-out 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        @keyframes ripple-out {
          0%   { width: 10px; height: 10px; opacity: 1; }
          100% { width: 60px; height: 60px; opacity: 0; }
        }
      `,
    });

    // DOM: Create cursor element and wire mouse events
    await page.evaluate(() => {
      if (document.getElementById('playwright-gold-cursor')) return;

      const cursor = document.createElement('div');
      cursor.id = 'playwright-gold-cursor';
      document.body.appendChild(cursor);

      // Track mouse position (pageX/pageY so it follows scroll)
      window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.pageX}px`;
        cursor.style.top = `${e.pageY}px`;
      });

      // Click-down animation + spawn ripple ring
      window.addEventListener('mousedown', (e) => {
        cursor.classList.add('clicking');

        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${e.pageX}px`;
        ripple.style.top = `${e.pageY}px`;
        document.body.appendChild(ripple);

        setTimeout(() => ripple.remove(), 700);
      });

      window.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
      });
    });
  }

  /**
   * Smooth cinematic scroll with 15ms intervals.
   * @param {'down'|'up'} direction - Scroll direction
   * @param {number} distance       - Pixels to scroll
   * @param {number} speed          - Pixels per tick (lower = slower & smoother)
   */
  async function smoothScroll(direction = 'down', distance = 800, speed = 8) {
    await page.evaluate(
      async ({ direction, distance, speed }) => {
        await new Promise((resolve) => {
          let current = window.scrollY;
          const step = direction === 'down' ? speed : -speed;
          const target =
            direction === 'down'
              ? current + distance
              : Math.max(0, current - distance);

          const interval = setInterval(() => {
            window.scrollTo(0, current);
            current += step;

            if (
              (step > 0 && current >= target) ||
              (step < 0 && current <= target) ||
              current >= document.body.scrollHeight - window.innerHeight ||
              current <= 0
            ) {
              clearInterval(interval);
              resolve();
            }
          }, 15);
        });
      },
      { direction, distance, speed }
    );
    await page.waitForTimeout(800);
  }

  /**
   * Human-speed typing with 40–110ms random delay per keystroke.
   * Glides cursor to the element before focusing and typing.
   */
  async function typeHumanSpeed(selector, text) {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();

    // Glide cursor to input center
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2,
        { steps: 12 }
      );
      await page.waitForTimeout(150);
    }

    await element.focus();
    await element.click();

    // Type character-by-character with organic delay
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(40 + Math.random() * 70); // 40–110ms
    }
    await page.waitForTimeout(200);
  }

  /**
   * Smoothly moves cursor to an element (12 interpolation steps) and clicks
   * with visible ripple feedback.
   */
  async function glideAndClick(selector) {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();

    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2,
        { steps: 12 }
      );
      await page.waitForTimeout(200);
      await page.mouse.down();
      await page.waitForTimeout(150);
      await page.mouse.up();
      await page.waitForTimeout(800);
    } else {
      await element.click();
    }
  }

  /**
   * Hover-only helper — glides cursor to an element center without clicking.
   * Useful for showcasing hover states (pricing card glow, button effects).
   */
  async function glideAndHover(selector, pauseMs = 1200) {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();

    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(
        box.x + box.width / 2,
        box.y + box.height / 2,
        { steps: 12 }
      );
      await page.waitForTimeout(pauseMs);
    }
  }

  // ── Walkthrough Flow ───────────────────────────────────────────────────────
  try {
    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 1 — Open Home Page & wait for hero animations                 │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 1. Opening Home Page...`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await injectVisualHelpers();
    await page.waitForTimeout(2000); // Admire hero section animations

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 2 — Click "Brands" link in the navbar                         │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 2. Navigating to Brands page via navbar...`);
    // Try the href-based selector first; fall back to text-based nav link
    const brandsLink = page.locator('a[href="/brands"]').first();
    await glideAndClick('a[href="/brands"]');
    await page.waitForLoadState('networkidle');
    await injectVisualHelpers();
    await page.waitForTimeout(1500);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 3 — Scroll through Brands hero section & 4 reason cards       │
    // │   Headline: "Connect with Creators Who Actually Convert"           │
    // │   Cards: Curated Creator Network, Tier 2 & 3 Reach,               │
    // │          Fast 48-hr Matching, Campaign Solutions                   │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 3. Showcasing Brands hero section & reason cards...`);
    // Slow scroll to reveal the headline and first set of cards
    await smoothScroll('down', 400, 3);
    await page.waitForTimeout(1000);
    await smoothScroll('down', 500, 3);
    await page.waitForTimeout(1200);
    // Additional slow scroll to ensure all 4 reason cards are visible
    await smoothScroll('down', 400, 3);
    await page.waitForTimeout(1000);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 4 — Scroll to Pricing Section & hover over tier cards         │
    // │   Basic (₹5,000) | Growth (₹18,000 - popular) | Premium (₹45,000) │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 4. Showcasing Pricing Section with hover effects...`);
    await smoothScroll('down', 500, 3);
    await page.waitForTimeout(1000);

    // Hover over each pricing tier card to trigger glow/border effects
    // Try multiple possible selectors for pricing cards

    // Basic tier (₹5,000)
    try {
      const basicCard = page.locator('text=₹5,000').first();
      if (await basicCard.isVisible({ timeout: 2000 })) {
        await glideAndHover('text=₹5,000', 1500);
        console.log(`   💰 Hovered: Basic tier (₹5,000)`);
      }
    } catch {
      // Card not found by price text, continue gracefully
      console.log(`   ⏭️  Basic tier card not found by text, continuing...`);
    }

    // Growth tier (₹18,000 — Popular)
    try {
      const growthCard = page.locator('text=₹18,000').first();
      if (await growthCard.isVisible({ timeout: 2000 })) {
        await glideAndHover('text=₹18,000', 2000);
        console.log(`   💰 Hovered: Growth tier (₹18,000) — Popular`);
      }
    } catch {
      console.log(`   ⏭️  Growth tier card not found by text, continuing...`);
    }

    // Premium tier (₹45,000)
    try {
      const premiumCard = page.locator('text=₹45,000').first();
      if (await premiumCard.isVisible({ timeout: 2000 })) {
        await glideAndHover('text=₹45,000', 1500);
        console.log(`   💰 Hovered: Premium tier (₹45,000)`);
      }
    } catch {
      console.log(`   ⏭️  Premium tier card not found by text, continuing...`);
    }

    await page.waitForTimeout(800);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 5 — Scroll to the inquiry form section (#inquiry-form)        │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 5. Scrolling to Brand Inquiry Form...`);
    // Attempt to scroll directly to the form anchor; fall back to smooth scroll
    try {
      const formSection = page.locator('#inquiry-form');
      if (await formSection.isVisible({ timeout: 3000 })) {
        await formSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
      } else {
        await smoothScroll('down', 600, 3);
      }
    } catch {
      await smoothScroll('down', 600, 3);
    }
    await page.waitForTimeout(800);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 6 — Fill the inquiry form with organic human-speed typing     │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 6. Filling Brand Inquiry Form with organic typing...`);

    // Brand Name
    console.log(`   ✍️  Typing Brand Name...`);
    await typeHumanSpeed(
      'input[placeholder="Your brand name"]',
      'Aura Luxury Group'
    );

    // Email
    console.log(`   ✍️  Typing Email...`);
    await typeHumanSpeed(
      'input[placeholder="brand@company.com"]',
      'marketing@auraluxury.com'
    );

    // Mobile
    console.log(`   ✍️  Typing Mobile Number...`);
    await typeHumanSpeed(
      'input[placeholder="9876543210"]',
      '9876543210'
    );

    // Budget Range (select dropdown)
    console.log(`   📋 Selecting Budget Range...`);
    await glideAndClick('select[name="budgetRange"]');
    await page.selectOption('select[name="budgetRange"]', '50000+');
    await page.waitForTimeout(600);

    // Categories (select dropdown)
    console.log(`   📋 Selecting Category...`);
    await glideAndClick('select[name="categories"]');
    await page.selectOption('select[name="categories"]', 'model');
    await page.waitForTimeout(600);

    // Campaign Message (textarea)
    console.log(`   ✍️  Typing Campaign Message...`);
    await typeHumanSpeed(
      'textarea[placeholder*="Tell us about your campaign goals"]',
      'Looking for premium fashion models and lifestyle creators in Ahmedabad and Mumbai for our upcoming luxury gold jewelry launch. We need elite aesthetic profiles for 3 Instagram Reels and 5 Stories. Budget is flexible for high-quality creators.'
    );

    await page.waitForTimeout(500);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 7 — Hover over submit button to show gold glow state          │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 7. Hovering over Submit button — gold glow state...`);
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.scrollIntoViewIfNeeded();
    const submitBox = await submitBtn.boundingBox();
    if (submitBox) {
      await page.mouse.move(
        submitBox.x + submitBox.width / 2,
        submitBox.y + submitBox.height / 2,
        { steps: 12 }
      );
      await page.waitForTimeout(1500); // Admire gold glow hover state
    }

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 8 — API is already mocked (route set up above)                │
    // │ STEP 9 — Click submit & wait for success screen transition         │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 8–9. Submitting form (API mocked) — waiting for success...`);
    await page.mouse.down();
    await page.waitForTimeout(150);
    await page.mouse.up();
    await page.waitForTimeout(3000); // Wait for success screen transition

    // Re-inject visual helpers in case the DOM changed after success render
    await injectVisualHelpers();

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 10 — Showcase success confirmation ("Inquiry Submitted!")      │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 10. Showcasing success confirmation screen...`);
    // Try to locate and hover over the success message for emphasis
    try {
      const successMsg = page.locator('text=Inquiry Submitted').first();
      if (await successMsg.isVisible({ timeout: 3000 })) {
        await glideAndHover('text=Inquiry Submitted', 1000);
      }
    } catch {
      // Success text might have different wording — still pause to show the screen
    }
    await page.waitForTimeout(3000); // Hold on the success screen

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 11 — Scroll back up slowly to hero section                    │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 11. Scrolling back up to Brands hero section...`);
    // Scroll to absolute top with multiple smooth scrolls
    await smoothScroll('up', 1500, 4);
    await smoothScroll('up', 2000, 5);
    await smoothScroll('up', 2000, 6);
    await page.waitForTimeout(1000);

    // ┌─────────────────────────────────────────────────────────────────────┐
    // │ STEP 12 — Final pause & close                                      │
    // └─────────────────────────────────────────────────────────────────────┘
    console.log(`🎬 12. Final cinematic pause...`);
    await page.waitForTimeout(2000);

    console.log(`\n🎉 BRAND INQUIRY JOURNEY WALKTHROUGH COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Walkthrough encountered an error:`, error);
  } finally {
    // ── Save recording ─────────────────────────────────────────────────────
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, 'brand_inquiry_video.webm');
      fs.copyFileSync(videoPath, targetPath);
      console.log(`\n🎉 BRAND INQUIRY DEMO VIDEO SAVED!`);
      console.log(`📁 Output: ${targetPath}`);
      console.log(
        `💡 Tip: Play in Chrome/Firefox or VLC. The WebM format is web-native and high quality.`
      );
    } else {
      console.error(`⚠️ Video recording reference was not generated.`);
    }
  }
})();
