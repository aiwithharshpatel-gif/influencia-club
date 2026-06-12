/**
 * Influenzia Club - Automated Influencer Onboarding & Dashboard Tour Video Generator
 * Powered by Playwright (v1.60.0)
 * 
 * This script automates the complete creator onboarding journey:
 * 1. Home page entry and navigation to the Join Now page.
 * 2. organic keyboard simulation to fill the registration form.
 * 3. Browser-side interception of the OTP creation and validation flow.
 * 4. Completion success screen wait.
 * 5. Full Creator Dashboard walkthrough tour (Overview, Profile, Referrals, Points, Collabs).
 * 
 * Usage:
 *   node generate_join_flow_video.js [target_url]
 *   Example: node generate_join_flow_video.js https://test.influenziaclub.com
 */

import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Setup target URL (defaults to staging server)
const targetUrl = process.argv[2] || 'https://test.influenziaclub.com';
const outputDir = path.resolve('./demo-videos');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log(`🚀 Starting Influenzia Club Onboarding & Dashboard Video Generator`);
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

  // ----------------------------------------------------
  // INTERCEPT & MOCK API ENDPOINTS (Browser-Side Routing)
  // ----------------------------------------------------
  let isLoggedIn = false;

  console.log(`📡 Setting up browser-side network interceptors...`);

  // Mock /auth/me to maintain login state
  await page.route('**/api/auth/me', async (route) => {
    if (isLoggedIn) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          role: 'creator',
          user: {
            id: 'mock-creator-101',
            name: 'Aria Sen',
            email: 'aria@influenzia.club',
            instagram: 'aria.sen',
            category: 'influencer',
            city: 'Ahmedabad',
            pointsBalance: 250
          }
        })
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: 'Not authenticated'
        })
      });
    }
  });

  // Mock /auth/register to proceed to OTP
  await page.route('**/api/auth/register', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Verification code sent to your email',
        email: 'aria@influenzia.club'
      })
    });
  });

  // Mock /auth/verify-otp to login successfully
  await page.route('**/api/auth/verify-otp', async (route) => {
    isLoggedIn = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'Registration successful! Welcome to Influenzia Club',
        creator: {
          id: 'mock-creator-101',
          name: 'Aria Sen',
          email: 'aria@influenzia.club',
          referralCode: 'ARIAS123',
          pointsBalance: 250
        }
      })
    });
  });

  // Mock dashboard overview statistics
  await page.route('**/api/dashboard/overview', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          creator: {
            id: 'mock-creator-101',
            name: 'Aria Sen',
            email: 'aria@influenzia.club',
            instagram: 'aria.sen',
            category: 'influencer',
            city: 'Ahmedabad',
            pointsBalance: 250,
            isVerified: true,
            bio: 'Elite Fashion & Luxury lifestyle micro-creator based in Ahmedabad. Runway model & brand promoter.',
            photoUrl: ''
          },
          referralCount: 3,
          activeCollabs: 2,
          profileCompletion: 80
        }
      })
    });
  });

  // Mock referrals list
  await page.route('**/api/dashboard/referrals', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          referralCode: 'ARIAS123',
          totalReferrals: 3,
          totalPointsEarned: 150,
          referrals: [
            {
              id: 'ref1',
              status: 'confirmed',
              referredUser: {
                name: 'Karan Sharma',
                createdAt: '2026-05-18T10:00:00Z'
              }
            },
            {
              id: 'ref2',
              status: 'confirmed',
              referredUser: {
                name: 'Riya Patel',
                createdAt: '2026-05-19T14:30:00Z'
              }
            },
            {
              id: 'ref3',
              status: 'pending',
              referredUser: {
                name: 'Sneha Gupta',
                createdAt: '2026-05-20T08:15:00Z'
              }
            }
          ]
        }
      })
    });
  });

  // Mock points transaction history
  await page.route('**/api/dashboard/points', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          balance: 250,
          history: [
            {
              id: 't1',
              reason: 'signup',
              createdAt: '2026-05-18T10:00:00Z',
              note: 'Signup bonus',
              type: 'earn',
              points: 10
            },
            {
              id: 't2',
              reason: 'referral',
              createdAt: '2026-05-18T12:00:00Z',
              note: 'Referred Karan Sharma',
              type: 'earn',
              points: 50
            },
            {
              id: 't3',
              reason: 'referral',
              createdAt: '2026-05-19T15:00:00Z',
              note: 'Referred Riya Patel',
              type: 'earn',
              points: 50
            }
          ]
        }
      })
    });
  });

  // Mock collaborations list
  await page.route('**/api/dashboard/collabs', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        collabs: [
          {
            id: 'collab1',
            status: 'invited',
            deliverables: '1 Instagram Reel, 1 Story. Tag @aurajewelry and use #AuraGold launch hashtag.',
            createdAt: '2026-05-20T10:00:00Z',
            campaign: {
              title: 'Aura Jewelry Gold Launch Campaign',
              brandInquiry: {
                brandName: 'Aura Luxury Group',
                packageType: 'exclusive'
              }
            }
          },
          {
            id: 'collab2',
            status: 'confirmed',
            deliverables: '1 YouTube Short showing premium jewelry box unboxing experience.',
            createdAt: '2026-05-19T09:00:00Z',
            campaign: {
              title: 'Unboxing Experience Campaign',
              brandInquiry: {
                brandName: 'Aura Luxury Group',
                packageType: 'standard'
              }
            }
          }
        ]
      })
    });
  });

  // ----------------------------------------------------
  // VISUAL CUSTOMIZATIONS (Scrollbar & Gold Cursor)
  // ----------------------------------------------------
  async function injectVisualHelpers() {
    await page.addStyleTag({
      content: `
        body, html {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
        ::-webkit-scrollbar {
          display: none !important;
        }
        /* Elegant golden cursor overlay */
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

  // Smooth scroll logic
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
    await page.waitForTimeout(800);
  }

  // Organic typing logic
  async function typeHumanSpeed(selector, text) {
    const element = page.locator(selector);
    await element.scrollIntoViewIfNeeded();
    
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 10 });
      await page.waitForTimeout(150);
    }
    
    await element.focus();
    await element.click();
    
    for (const char of text) {
      await page.keyboard.type(char);
      await page.waitForTimeout(40 + Math.random() * 70);
    }
    await page.waitForTimeout(200);
  }

  // Glide and click logic
  async function glideAndClick(selector) {
    const element = page.locator(selector).first();
    await element.scrollIntoViewIfNeeded();
    const box = await element.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
      await page.waitForTimeout(200);
      await page.mouse.down();
      await page.waitForTimeout(800); // Highlight click ripple
      await page.mouse.up();
      await page.waitForTimeout(800);
    } else {
      await element.click();
    }
  }

  // ----------------------------------------------------
  // WALKTHROUGH FLOW EXECUTION
  // ----------------------------------------------------
  try {
    // 1. Visit Home Page
    console.log(`🎬 1. Opening Home Page...`);
    await page.goto(targetUrl);
    await page.waitForLoadState('networkidle');
    await injectVisualHelpers();
    await page.waitForTimeout(1500);

    // 2. Click "Join Now" in Navbar
    console.log(`🎬 2. Transitioning to Join Page...`);
    await glideAndClick('a[href="/join"]');
    await page.waitForLoadState('networkidle');
    await injectVisualHelpers();
    await page.waitForTimeout(1000);

    // 3. Scroll Join page to show benefits & form
    await smoothScroll('down', 450, 4);

    // 4. Fill Registration Form
    console.log(`🎬 3. Autofilling Influencer Signup Details...`);
    await typeHumanSpeed('input[placeholder="Enter your full name"]', 'Aria Sen');
    await typeHumanSpeed('input[placeholder="your@email.com"]', 'aria@influenzia.club');
    await typeHumanSpeed('input[placeholder="9876543210"]', '9876543210');
    await typeHumanSpeed('input[placeholder="@username"]', 'aria.sen');

    // Category Select
    await glideAndClick('select:near(label:has-text("Category"))');
    await page.selectOption('select:has-text("Select")', 'influencer');
    await page.waitForTimeout(500);

    // City Select
    await glideAndClick('select:near(label:has-text("City"))');
    await page.selectOption('select:has-text("Ahmedabad")', 'Ahmedabad');
    await page.waitForTimeout(500);

    // Referral Code
    await typeHumanSpeed('input[placeholder="Enter referral code"]', 'HARSH50');
    await page.waitForTimeout(800);

    // Submit Registration Form
    console.log(`🎬 4. Submitting Registration Form...`);
    await glideAndClick('button:has-text("Send Verification Code")');
    await page.waitForTimeout(2000); // Transition to OTP

    // 5. Fill OTP verification
    console.log(`🎬 5. Completing Email OTP Onboarding...`);
    await injectVisualHelpers();
    await typeHumanSpeed('input[placeholder="000000"]', '123456');
    await page.waitForTimeout(1000);
    
    // Submit OTP
    await glideAndClick('button:has-text("Verify Email")');
    await page.waitForTimeout(2500); // Transition to Success

    // 6. Showcase Success Screen
    console.log(`🎬 6. Showcasing Welcome Success Screen...`);
    await injectVisualHelpers();
    await smoothScroll('down', 200, 3);
    await page.waitForTimeout(3000);

    // 7. Click Go To Dashboard
    console.log(`🎬 7. Entering Creator Dashboard Tour...`);
    await glideAndClick('a:has-text("Go to Dashboard")');
    await page.waitForLoadState('networkidle');
    await injectVisualHelpers();
    await page.waitForTimeout(2000);

    // 8. Tour: Overview Dashboard Page
    console.log(`🎬 8. Touring Dashboard Overview...`);
    await smoothScroll('down', 600, 3);
    await smoothScroll('up', 300, 4);

    // 9. Tour: Edit Profile Page
    console.log(`🎬 9. Touring Profile Edit Page...`);
    await glideAndClick('a[href="/dashboard/profile"]');
    await injectVisualHelpers();
    await page.waitForTimeout(1000);
    await smoothScroll('down', 500, 3);
    await smoothScroll('up', 200, 4);

    // 10. Tour: Refer & Earn Page
    console.log(`🎬 10. Touring Referrals Page & Widget...`);
    await glideAndClick('a[href="/dashboard/referrals"]');
    await injectVisualHelpers();
    await page.waitForTimeout(1000);
    await smoothScroll('down', 600, 3);

    // 11. Tour: Points & Rewards Page
    console.log(`🎬 11. Touring Points Balance & History...`);
    await glideAndClick('a[href="/dashboard/points"]');
    await injectVisualHelpers();
    await page.waitForTimeout(1000);
    await smoothScroll('down', 700, 3);

    // 12. Tour: Brands Collaborations Page
    console.log(`🎬 12. Touring Collaborations List...`);
    await glideAndClick('a[href="/dashboard/collabs"]');
    await injectVisualHelpers();
    await page.waitForTimeout(1000);
    await smoothScroll('down', 500, 3);
    await page.waitForTimeout(2000);

    // 13. Logout and finish
    console.log(`🎬 13. Logging out from Dashboard...`);
    await glideAndClick('button:has-text("Logout")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    console.log(`🎉 WALKTHROUGH FLOW COMPLETED SUCCESSFULLY!`);

  } catch (error) {
    console.error(`❌ Walkthrough encountered an error:`, error);
  } finally {
    const video = page.video();
    await context.close();
    await browser.close();

    if (video) {
      const videoPath = await video.path();
      const targetPath = path.join(outputDir, 'influencer_join_flow_video.webm');
      fs.copyFileSync(videoPath, targetPath);
      console.log(`\n🎉 INFLUENCER JOIN FLOW DEMO VIDEO SAVED!`);
      console.log(`📁 Target File: ${targetPath}`);
    } else {
      console.error(`⚠️ Video file failed to record natively.`);
    }
  }
})();
