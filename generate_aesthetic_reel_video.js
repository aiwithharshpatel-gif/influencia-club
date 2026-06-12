/**
 * Influenzia Club - Aesthetic Reel / Cinematic Montage Generator
 * Powered by Playwright (v1.60.0)
 *
 * A pure visual showcase of the premium dark-and-gold design.
 * NO cursor overlay, NO form filling, NO interactive clicks —
 * just slow, dreamy scrolling and clean page transitions.
 *
 * Usage:
 *   node generate_aesthetic_reel_video.js [target_url]
 *   Example: node generate_aesthetic_reel_video.js https://test.influenziaclub.com
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// ── Configuration ───────────────────────────────────────────────
const targetUrl = process.argv[2] || 'https://test.influenziaclub.com';
const outputDir = path.resolve('./demo-videos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`✨ Starting Influenzia Club — Aesthetic Reel Generator`);
console.log(`🔗 Target URL: ${targetUrl}`);
console.log(`📂 Output Directory: ${outputDir}\n`);

// ── Main ────────────────────────────────────────────────────────
(async () => {
  const browser = await chromium.launch({ headless: true });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 },
    },
  });

  const page = await context.newPage();

  // ── Helpers ─────────────────────────────────────────────────

  /**
   * Inject scrollbar-hiding CSS.
   * Called after every navigation so new documents stay clean.
   * NO cursor overlay — this is a purely cinematic capture.
   */
  async function injectCleanStyles() {
    await page.addStyleTag({
      content: `
        body, html {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
      `,
    });
  }

  /**
   * Ultra-slow cinematic scroll.
   * @param {'down'|'up'} direction  Scroll direction
   * @param {number}      distance   Total pixels to scroll
   * @param {number}      speed      Pixels per tick (default 2 — very slow)
   */
  async function smoothScroll(direction = 'down', distance = 400, speed = 2) {
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
          }, 15); // 15 ms per tick → dreamy, cinematic cadence
        });
      },
      { direction, distance, speed },
    );
  }

  // ── Walkthrough Flow ────────────────────────────────────────

  try {
    // ─── 1. Home Page — Hero Animation ───────────────────────
    console.log(`🎬 [1/11] Opening Home page…`);
    await page.goto(targetUrl, { waitUntil: 'networkidle' });
    await injectCleanStyles();

    // Let the full hero animation play out:
    // golden particles, animated counters, gradient text reveal
    await page.waitForTimeout(3000);

    // ─── 2. Slow scroll through hero ─────────────────────────
    console.log(`🎬 [2/11] Scrolling through hero section…`);
    await smoothScroll('down', 400, 2);
    await page.waitForTimeout(2000); // Let the viewer absorb the headline

    // ─── 3. Pause on stats section ───────────────────────────
    console.log(`🎬 [3/11] Pausing on stats section…`);
    await smoothScroll('down', 300, 2);
    await page.waitForTimeout(2000); // 500+ Elite Creators, 50+ Luxury Brands…

    // ─── 4. Scroll through categories / tilt cards ───────────
    console.log(`🎬 [4/11] Scrolling through categories…`);
    await smoothScroll('down', 500, 2);
    await page.waitForTimeout(1500);

    // ─── 5. Navigate to About page ───────────────────────────
    console.log(`🎬 [5/11] Navigating to About page…`);
    await page.click('nav a[href="/about"]');
    await page.waitForLoadState('networkidle');
    await injectCleanStyles();
    await page.waitForTimeout(1500);

    // ─── 6. Scroll down About page ──────────────────────────
    console.log(`🎬 [6/11] Scrolling through About — mission section…`);
    await smoothScroll('down', 600, 2);
    await page.waitForTimeout(2000);

    // ─── 7. Navigate to Creators page ────────────────────────
    console.log(`🎬 [7/11] Navigating to Creators page…`);
    await page.click('nav a[href="/creators"]');
    await page.waitForLoadState('networkidle');
    await injectCleanStyles();
    await page.waitForTimeout(1500);

    // ─── 8. Scroll through creator cards ─────────────────────
    console.log(`🎬 [8/11] Scrolling through creator cards…`);
    await smoothScroll('down', 500, 2);
    await page.waitForTimeout(2000);

    // ─── 9. Navigate back to Home page ───────────────────────
    console.log(`🎬 [9/11] Returning to Home page…`);
    await page.click('nav a[href="/"]');
    await page.waitForLoadState('networkidle');
    await injectCleanStyles();
    await page.waitForTimeout(1000);

    // ─── 10. Final beauty shot on hero ───────────────────────
    console.log(`🎬 [10/11] Final beauty shot — hero section…`);
    await page.waitForTimeout(2000);

    // ─── 11. Done ────────────────────────────────────────────
    console.log(`🎬 [11/11] Walkthrough complete.`);

  } catch (error) {
    console.error(`❌ Aesthetic reel generation encountered an error:`, error);
  } finally {
    // Save the recording
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, 'aesthetic_reel_video.webm');
      fs.copyFileSync(videoPath, targetPath);
      console.log(`\n🎉 AESTHETIC REEL VIDEO GENERATED SUCCESSFULLY!`);
      console.log(`📁 File: ${targetPath}`);
      console.log(`💡 Tip: Playable in Chrome, Firefox, or VLC.`);
    } else {
      console.log(`⚠️ Video recording reference was not captured.`);
    }
  }
})();
