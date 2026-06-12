/**
 * Influenzia Club - Mobile Responsive Demo Video Generator
 * Powered by Playwright (v1.60.0)
 * 
 * Records a cinematic walkthrough of the Influenzia Club platform
 * on a mobile viewport (375x812, iPhone-like). Navigates exclusively
 * via the hamburger menu to showcase the true mobile UX.
 * 
 * Usage:
 *   node generate_mobile_responsive_video.js [target_url]
 *   Example: node generate_mobile_responsive_video.js https://test.influenziaclub.com
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// ── Configuration ────────────────────────────────────────────────
const targetUrl = process.argv[2] || 'https://test.influenziaclub.com';
const outputDir = path.resolve('./demo-videos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`📱 Starting Influenzia Club Mobile Responsive Video Generator`);
console.log(`🔗 Target URL: ${targetUrl}`);
console.log(`📐 Viewport: 375 × 812 (iPhone-like)`);
console.log(`📂 Output Directory: ${outputDir}\n`);

(async () => {
  // Launch Chromium
  const browser = await chromium.launch({
    headless: true,
  });

  // Mobile viewport context with native video recording
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    recordVideo: {
      dir: outputDir,
      size: { width: 375, height: 812 }
    },
    // Emulate mobile touch & user agent for authentic feel
    hasTouch: true,
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  });

  const page = await context.newPage();

  // ── Visual Helpers ──────────────────────────────────────────────

  /**
   * Inject the golden cursor overlay (smaller 14px for mobile feel)
   * and hide scrollbars for clean cinematic capture.
   */
  async function injectVisualHelpers() {
    // Hide scrollbars
    await page.addStyleTag({
      content: `
        body, html {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
        /* Mobile-sized golden cursor overlay (14px) */
        #playwright-gold-cursor {
          position: absolute;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.65);
          border: 1.5px solid #ffffff;
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.8), 0 0 16px rgba(212, 175, 55, 0.4);
          pointer-events: none;
          z-index: 999999;
          transform: translate(-50%, -50%);
          transition: transform 0.1s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.15s, width 0.15s, height 0.15s;
        }
        #playwright-gold-cursor.clicking {
          width: 22px;
          height: 22px;
          background: rgba(212, 175, 55, 0.9);
          transform: translate(-50%, -50%) scale(0.85);
          box-shadow: 0 0 12px rgba(212, 175, 55, 1), 0 0 24px rgba(212, 175, 55, 0.7);
        }
        .click-ripple {
          position: absolute;
          border: 1.5px solid rgba(212, 175, 55, 0.8);
          border-radius: 50%;
          pointer-events: none;
          z-index: 999998;
          transform: translate(-50%, -50%);
          animation: ripple-out 0.6s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        @keyframes ripple-out {
          0% {
            width: 8px;
            height: 8px;
            opacity: 1;
          }
          100% {
            width: 44px;
            height: 44px;
            opacity: 0;
          }
        }
      `
    });

    // Inject cursor DOM and event listeners
    await page.evaluate(() => {
      if (document.getElementById('playwright-gold-cursor')) return;

      const cursor = document.createElement('div');
      cursor.id = 'playwright-gold-cursor';
      document.body.appendChild(cursor);

      window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.pageX}px`;
        cursor.style.top = `${e.pageY}px`;
      });

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
   * Smooth cinematic scroll – SLOWER for mobile feel.
   * Default speed is 3–5 (vs 8 for desktop scripts).
   */
  async function smoothScroll(direction = 'down', distance = 600, speed = 4) {
    await page.evaluate(async ({ direction, distance, speed }) => {
      await new Promise((resolve) => {
        let currentScroll = window.scrollY;
        const step = direction === 'down' ? speed : -speed;
        const target = direction === 'down'
          ? currentScroll + distance
          : Math.max(0, currentScroll - distance);

        const interval = setInterval(() => {
          window.scrollTo(0, currentScroll);
          currentScroll += step;

          if (
            (step > 0 && currentScroll >= target) ||
            (step < 0 && currentScroll <= target) ||
            currentScroll >= document.body.scrollHeight - window.innerHeight ||
            currentScroll <= 0
          ) {
            clearInterval(interval);
            resolve();
          }
        }, 15);
      });
    }, { direction, distance, speed });

    // Pause after scroll for visual comprehension
    await page.waitForTimeout(1200);
  }

  /**
   * Human-speed typing with 50–120ms organic delay per keystroke.
   */
  async function typeHumanSpeed(selector, text) {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();

    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
      await page.waitForTimeout(200);
    }

    await element.focus();
    await element.click();

    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50 + Math.random() * 70); // 50-120ms organic delay
    }
    await page.waitForTimeout(300);
  }

  /**
   * Glide cursor smoothly to element, then click with ripple pause.
   */
  async function glideAndClick(selector) {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
      await page.waitForTimeout(250);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(800);
    } else {
      await element.click();
    }
  }

  /**
   * Open the mobile hamburger menu.
   * The button has className "md:hidden" and contains an SVG (Menu/X icon).
   * We use a robust selector: the button inside nav that is NOT hidden on mobile.
   */
  async function openMobileMenu() {
    // The mobile menu toggle: <button class="md:hidden ..."> inside <nav>
    const menuBtn = page.locator('nav button').first();
    await glideAndClick('nav button');
    // Wait for the mobile menu drawer to appear
    await page.waitForTimeout(600);
  }

  /**
   * Click a link in the opened mobile menu by its visible text.
   * After navigation, re-inject visual helpers since the page changes.
   */
  async function clickMobileMenuLink(linkText) {
    // Mobile menu links are inside the nav's dropdown panel
    // They are <Link to="..."> rendered as <a> tags
    const link = page.locator(`nav a:has-text("${linkText}")`).first();
    await glideAndClick(`nav a:has-text("${linkText}")`);
    await page.waitForLoadState('networkidle');
    await injectVisualHelpers();
    await page.waitForTimeout(1000);
  }

  // ── WALKTHROUGH FLOW ────────────────────────────────────────────

  try {
    // ── Step 1: Home Page ──────────────────────────────────────
    console.log(`📱 1. Opening Home Page on mobile viewport...`);
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');
    await injectVisualHelpers();

    // Wait for hero animations, golden particles, entrance effects
    await page.waitForTimeout(2500);

    // ── Step 2: Scroll through hero section ─────────────────────
    console.log(`📱 2. Scrolling through hero – "Influence. Inspire. Ignite."...`);
    await smoothScroll('down', 500, 3); // Headline + CTA buttons
    await smoothScroll('down', 400, 3); // Animated counters

    // ── Step 3: Categories section ──────────────────────────────
    console.log(`📱 3. Scrolling through "Find Your Category" section...`);
    await smoothScroll('down', 600, 4);

    // ── Step 4: Features and testimonials ───────────────────────
    console.log(`📱 4. Scrolling through features & testimonials...`);
    await smoothScroll('down', 700, 3);
    await smoothScroll('down', 600, 3);

    // ── Step 5: Scroll back to top ──────────────────────────────
    console.log(`📱 5. Scrolling back to top...`);
    await smoothScroll('up', 3000, 5);
    await page.waitForTimeout(800);

    // ── Step 6: Open hamburger menu ─────────────────────────────
    console.log(`📱 6. Opening mobile hamburger menu...`);
    await openMobileMenu();

    // ── Step 7: Navigate to About ───────────────────────────────
    console.log(`📱 7. Navigating to About page via mobile menu...`);
    await clickMobileMenuLink('About');

    // ── Step 8: Scroll through About page ───────────────────────
    console.log(`📱 8. Scrolling through About page content...`);
    await smoothScroll('down', 500, 3);
    await smoothScroll('down', 600, 3);
    await smoothScroll('down', 400, 4);

    // ── Step 9: Open menu → Creators ────────────────────────────
    console.log(`📱 9. Opening menu → Creators page...`);
    await openMobileMenu();
    await clickMobileMenuLink('Creators');

    // ── Step 10: Scroll through Creators showcase ───────────────
    console.log(`📱 10. Scrolling through Creators showcase...`);
    await smoothScroll('down', 600, 3);
    await smoothScroll('down', 500, 3);

    // ── Step 11: Open menu → Brands ─────────────────────────────
    console.log(`📱 11. Opening menu → Brands page...`);
    await openMobileMenu();
    await clickMobileMenuLink('Brands');

    // ── Step 12: Scroll through Brands page (pricing cards stacked) ──
    console.log(`📱 12. Scrolling through Brands pricing cards (stacked on mobile)...`);
    await smoothScroll('down', 500, 3);
    await smoothScroll('down', 600, 3);
    await smoothScroll('down', 500, 4);

    // ── Step 13: Fill brand name in inquiry form ────────────────
    console.log(`📱 13. Filling brand name in inquiry form (mobile form UX)...`);
    await typeHumanSpeed('input[name="brandName"]', 'Vogue India');
    await page.waitForTimeout(800);

    // ── Step 14: Open menu → Join Now ───────────────────────────
    console.log(`📱 14. Opening menu → Join Now page...`);
    await openMobileMenu();
    await clickMobileMenuLink('Join Now');

    // ── Step 15: Scroll through Join page ───────────────────────
    console.log(`📱 15. Scrolling through Join page – benefits & registration form...`);
    await smoothScroll('down', 500, 3);
    await smoothScroll('down', 600, 3);
    await smoothScroll('down', 400, 4);

    // ── Step 16: Scroll back to top and close ───────────────────
    console.log(`📱 16. Scrolling back to top, final pause...`);
    await smoothScroll('up', 2000, 5);
    await page.waitForTimeout(2000);

    console.log(`🎉 MOBILE RESPONSIVE WALKTHROUGH COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Mobile walkthrough encountered an error:`, error);
  } finally {
    // Safely save the recorded video
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, 'mobile_responsive_video.webm');
      fs.copyFileSync(videoPath, targetPath);
      console.log(`\n🎉 MOBILE RESPONSIVE DEMO VIDEO GENERATED SUCCESSFULLY!`);
      console.log(`📁 Target File: ${targetPath}`);
      console.log(`📐 Resolution: 375 × 812 (iPhone-like mobile viewport)`);
      console.log(`💡 Playable in Chrome, Firefox, or VLC Player.`);
    } else {
      console.error(`⚠️ Video recording reference was not generated.`);
    }
  }
})();
