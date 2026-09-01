import nodemailer from 'nodemailer';
import validator from 'validator';

const isPlaceholderPassword = (pass) => {
  if (!pass || typeof pass !== 'string') return true;
  const p = pass.trim().toLowerCase();
  return (
    p === '' ||
    p.includes('your_') ||
    p.includes('change_me') ||
    p.includes('placeholder') ||
    p.includes('your_hostinger_smtp_password') ||
    p.includes('re_your_resend_api_key')
  );
};

const hasRealCredentials = !isPlaceholderPassword(process.env.SMTP_PASS);

let transporter = null;
if (hasRealCredentials) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.resend.com',
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: (parseInt(process.env.SMTP_PORT) === 465 || !process.env.SMTP_PORT),
    auth: {
      user: process.env.SMTP_USER || 'resend',
      pass: process.env.SMTP_PASS
    }
  });

  transporter.verify(function (error, success) {
    if (error) {
      console.warn("[SMTP Service] Transporter verification failed (will use fallback):", error.message);
    } else {
      console.log("[SMTP Service] Transporter verified successfully.");
    }
  });
}

export const sendEmail = async (options) => {
  const isPlaceholder = isPlaceholderPassword(process.env.SMTP_PASS);
  const otpCode = options.html?.match(/\d{6}/)?.[0] || 'N/A';

  if (isPlaceholder || !transporter) {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║           📧 INFLUENZIA CLUB EMAIL SERVICE (DEV/MOCK)    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║ To:      ${options.to}`);
    console.log(`║ Subject: ${options.subject}`);
    if (otpCode !== 'N/A') {
      console.log(`║ 🔑 OTP CODE: >>>  ${otpCode}  <<<`);
    }
    console.log('╚══════════════════════════════════════════════════════════╝');

    if (process.env.NODE_ENV === 'production' && process.env.STRICT_SMTP === 'true') {
      return { 
        success: false, 
        error: 'Email service not configured. Please contact support.' 
      };
    }
    
    return { success: true, messageId: 'mock-id-dev', isDevMock: true, note: 'Logged to console' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Influenzia Club <no-reply@influenziaclub.com>',
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[SMTP] Email sent successfully to ${options.to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('--- NODEMAILER ERROR ---');
    console.error('To:', options.to);
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    if (error.response) console.error('SMTP Response:', error.response);
    console.error('------------------------');

    // In development or non-strict environments, fallback to console OTP instead of failing registration
    if (process.env.NODE_ENV !== 'production' || process.env.STRICT_SMTP !== 'true') {
      console.log(`[SMTP Fallback] OTP for ${options.to}: ${otpCode}`);
      return { success: true, messageId: 'fallback-otp-logged', fallback: true };
    }

    return { success: false, error: error.message };
  }
};

export const sendVerificationEmail = async (email, otp, name) => {
  const safeName = validator.escape(name || 'Creator');
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Welcome, ${safeName}</h2>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px;">${otp}</div>
      <p>Valid for 10 minutes.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Verify Your Email - Influenzia Club',
    html
  });
};

export const sendWelcomeEmail = async (email, name, referralCode) => {
  const safeName = validator.escape(name || 'Creator');
  const referralLink = `${process.env.REFERRAL_BASE_URL || 'https://influenziaclub.com/join?ref='}${validator.escape(referralCode || '')}`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>Welcome to the Club, ${safeName}</h2>
      <p>Your referral link is: <strong>${referralLink}</strong></p>
      <p>Signup Bonus: +10 pts</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Influenzia Club',
    html
  });
};

export const sendPasswordResetEmail = async (email, token, name) => {
  const safeName = validator.escape(name || 'Creator');
  const resetLink = `${process.env.FRONTEND_URL || 'https://influenziaclub.com'}/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <p>Hi ${safeName},</p>
      <p>Click below to reset your password:</p>
      <a href="${resetLink}">Reset Password</a>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Influenzia Club',
    html
  });
};

export const sendInquiryNotificationEmail = async (inquiryData) => {
  const { brandName, email, mobile, budgetRange, categories, message } = inquiryData;
  const safeBrandName = validator.escape(brandName || 'Brand Partner');
  const safeEmail = validator.escape(email || '');
  const safeMobile = validator.escape(mobile || '');
  const safeBudget = validator.escape(budgetRange || '');
  const safeCategories = validator.escape(Array.isArray(categories) ? categories.join(', ') : (categories || ''));
  const safeMessage = validator.escape(message || 'No additional message provided');

  // 1. Send confirmation to the brand
  const brandHtml = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #6366f1; margin: 0; font-size: 24px;">Influenzia Club</h2>
        <p style="color: #6b7280; margin: 4px 0 0 0;">Campaign Inquiry Received</p>
      </div>
      <p style="color: #1f2937; font-size: 16px;">Hi <strong>${safeBrandName}</strong>,</p>
      <p style="color: #4b5563; line-height: 1.6;">
        Thank you for submitting your campaign inquiry! Our brand partnerships team has received your request and is reviewing creator matches for your budget (<strong>₹${safeBudget}</strong>) and categories (<strong>${safeCategories}</strong>).
      </p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Inquiry Summary</h3>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Brand:</strong> ${safeBrandName}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Email:</strong> ${safeEmail}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Mobile:</strong> ${safeMobile}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Budget Range:</strong> ₹${safeBudget}</p>
        <p style="margin: 4px 0; color: #4b5563; font-size: 14px;"><strong>Categories:</strong> ${safeCategories}</p>
      </div>
      <p style="color: #4b5563; line-height: 1.6;">
        You can track your campaigns and assigned creator collaborations at any time by logging into the <strong>Brand Dashboard</strong> using your registered email: <strong>${safeEmail}</strong>.
      </p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/brand-dashboard" style="background: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
          Open Brand Dashboard
        </a>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px; border-top: 1px solid #e5e7eb; padding-top: 16px;">
        Influenzia Club — Connecting Brands with Top Influencers & Creators
      </p>
    </div>
  `;

  // 2. Send notification to admin
  const adminHtml = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h3 style="color: #6366f1;">New Brand Campaign Inquiry</h3>
      <p><strong>Brand Name:</strong> ${safeBrandName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Mobile:</strong> ${safeMobile}</p>
      <p><strong>Budget Range:</strong> ₹${safeBudget}</p>
      <p><strong>Target Categories:</strong> ${safeCategories}</p>
      <p><strong>Message / Brief:</strong></p>
      <blockquote style="background: #f9fafb; padding: 10px; border-left: 3px solid #6366f1; margin: 10px 0;">
        ${safeMessage}
      </blockquote>
    </div>
  `;

  try {
    // Send to brand
    await sendEmail({
      to: email,
      subject: 'We Received Your Campaign Inquiry - Influenzia Club',
      html: brandHtml
    });

    // Send to admin
    await sendEmail({
      to: process.env.ADMIN_NOTIFICATION_EMAIL || process.env.EMAIL_FROM || 'admin@influenziaclub.com',
      subject: `[New Inquiry] ${safeBrandName} - ₹${safeBudget}`,
      html: adminHtml
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending inquiry emails:', error);
    return { success: false, error: error.message };
  }
};

