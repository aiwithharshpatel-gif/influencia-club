/**
 * Influenzia Club - Automated Demo Video Generator
 * Powered by Playwright (v1.60.0)
 * 
 * This script automates a premium browser walkthrough of Influenzia Club,
 * records the screen natively, injects a gold cursor, hides scrollbars,
 * and outputs a gorgeous demo video.
 * 
 * Usage:
 *   node generate_demo_video.js [target_url]
 *   Example: node generate_demo_video.js http://localhost:5173
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Setup target URL (defaults to local Vite port)
const targetUrl = process.argv[2] || 'http://localhost:5173';
const outputDir = path.resolve('./demo-videos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`🚀 Starting Influenzia Club Demo Video Generator`);
console.log(`🔗 Target URL: ${targetUrl}`);
console.log(`📂 Output Directory: ${outputDir}\n`);

(async () => {
  // Launch Chromium
  const browser = await chromium.launch({
    headless: true, // Run in background silently while recording high quality video
  });

  // Create high-definition context with native video recording enabled
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  // Helper to inject the premium golden cursor and scrollbar overrides
  async function injectVisualHelpers() {
    // Hide scrollbars for a clean cinematic capture
    await page.addStyleTag({
      content: `
        body, html {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
        /* Ensure cursor overlay sits on top of everything */
        #playwright-gold-cursor {
          position: absolute;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(212, 175, 55, 0.65); /* Elegant gold */
          border: 2px solid #ffffff;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8), 0 0 20px rgba(212, 175, 55, 0.4);
          pointer-events: none;
          z-index: 999999;
          transform: translate(-50%, -50%);
          transition: transform 0.1s cubic-bezier(0.25, 1, 0.5, 1), background-color 0.15s, width 0.15s, height 0.15s;
        }
        #playwright-gold-cursor.clicking {
          width: 28px;
          height: 28px;
          background: rgba(212, 175, 55, 0.9);
          transform: translate(-50%, -50%) scale(0.85);
          box-shadow: 0 0 15px rgba(212, 175, 55, 1), 0 0 30px rgba(212, 175, 55, 0.7);
        }
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
          0% {
            width: 10px;
            height: 10px;
            opacity: 1;
          }
          100% {
            width: 60px;
            height: 60px;
            opacity: 0;
          }
        }
      `
    });

    // Inject cursor DOM structure and events
    await page.evaluate(() => {
      if (document.getElementById('playwright-gold-cursor')) return;

      const cursor = document.createElement('div');
      cursor.id = 'playwright-gold-cursor';
      document.body.appendChild(cursor);

      // Mouse position tracker
      window.addEventListener('mousemove', (e) => {
        cursor.style.left = `${e.pageX}px`;
        cursor.style.top = `${e.pageY}px`;
      });

      // Mouse clicking animation
      window.addEventListener('mousedown', (e) => {
        cursor.classList.add('clicking');
        
        // Spawn premium ripple
        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${e.pageX}px`;
        ripple.style.top = `${e.pageY}px`;
        document.body.appendChild(ripple);

        // Auto remove ripple DOM elements
        setTimeout(() => ripple.remove(), 700);
      });

      window.addEventListener('mouseup', () => {
        cursor.classList.remove('clicking');
      });
    });
  }

  // Smooth cinematic scrolling logic
  async function smoothScroll(direction = 'down', distance = 800, speed = 8) {
    await page.evaluate(async ({ direction, distance, speed }) => {
      await new Promise((resolve) => {
        let currentScroll = window.scrollY;
        const step = direction === 'down' ? speed : -speed;
        const target = direction === 'down' ? currentScroll + distance : Math.max(0, currentScroll - distance);

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
    
    // Add visual delay
    await page.waitForTimeout(1000);
  }

  // Realistic human-speed typing helper
  async function typeHumanSpeed(selector, text) {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    
    // Smooth glide cursor to element position
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
      await page.waitForTimeout(200);
    }
    
    await element.focus();
    await element.click();
    
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(50 + Math.random() * 80); // Organic typing delay
    }
    await page.waitForTimeout(300);
  }

  // Glide and click helper
  async function glideAndClick(selector) {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    if (box) {
      // Glides cursor smoothly to coordinate
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 15 });
      await page.waitForTimeout(300);
      await page.mouse.down();
      await page.waitForTimeout(100);
      await page.mouse.up();
      await page.waitForTimeout(800);
    } else {
      await element.click();
    }
  }

  // ----------------------------------------------------
  // WALKTHROUGH FLOW
  // ----------------------------------------------------

  try {
    // 1. Visit Home Page
    console.log(`🎬 Recording Home Page...`);
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');
    await injectVisualHelpers();

    // Initial cinematic wait to appreciate the landing visual
    await page.waitForTimeout(2500);

    // Scroll through hero & stats
    await smoothScroll('down', 650, 4);
    await smoothScroll('down', 850, 3); // Testimonials and stats

    // Glide to "About" link in Navbar and click
    console.log(`🎬 Recording About Page...`);
    await glideAndClick('nav a[href="/about"]');
    await injectVisualHelpers();
    
    // Scroll through the corporate mission
    await smoothScroll('down', 1000, 3);
    await smoothScroll('up', 500, 4);

    // Navigate to Brands Page
    console.log(`🎬 Recording Brands Page & Demo Inquiry...`);
    await glideAndClick('nav a[href="/brands"]');
    await injectVisualHelpers();
    await smoothScroll('down', 600, 4);

    // Demonstrate Brand Inquiry Form Submission
    await typeHumanSpeed('input[name="brandName"]', 'Aura Luxury Group');
    await typeHumanSpeed('input[name="email"]', 'collabs@auraluxury.com');
    await typeHumanSpeed('input[name="mobile"]', '9876543210');
    
    // Budget selector click
    await glideAndClick('select[name="budgetRange"]');
    await page.selectOption('select[name="budgetRange"]', '50000+');
    await page.waitForTimeout(600);

    // Message box typing
    await typeHumanSpeed('textarea[name="message"]', 'Looking for high-fashion micro-creators and runway models across Ahmedabad and Mumbai to collaborate on our upcoming gold jewelry launch. Looking for elite aesthetic profiles only!');

    // Scroll slightly down to showcase the inquiry submission CTA
    await smoothScroll('down', 300, 3);
    
    // Hover over inquiry submit button to display elite gold hover state
    const submitBtn = page.locator('button[type="submit"]');
    const btnBox = await submitBtn.boundingBox();
    if (btnBox) {
      await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2, { steps: 10 });
      await page.waitForTimeout(1500); // Admire hover state glow
    }

    // Go to Creators Directory
    console.log(`🎬 Recording Creators Showcase...`);
    await glideAndClick('nav a[href="/creators"]');
    await injectVisualHelpers();
    await smoothScroll('down', 800, 3);

    // Go to Join / Onboarding Form
    console.log(`🎬 Recording Join/Onboarding Form...`);
    await glideAndClick('nav a[href="/join"]');
    await injectVisualHelpers();
    await smoothScroll('down', 500, 3);

    // Success Screen Walkthrough
    console.log(`🎬 Walkthrough Completed successfully.`);
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error(`❌ Visual generation encountered an error:`, error);
  } finally {
    // Safely save recording
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, 'influenzia_demo_video.webm');
      fs.copyFileSync(videoPath, targetPath);
      console.log(`\n🎉 CINEMATIC DEMO VIDEO GENERATED SUCCESSFULLY!`);
      console.log(`📁 Target File: ${targetPath}`);
      console.log(`💡 Note: The video records natively in high-quality WebM format, perfect for modern web platforms and directly playable in Chrome/Firefox or VLC Player.`);
    } else {
      console.log(`⚠️ Video recording reference was not generated.`);
    }
  }
})();
