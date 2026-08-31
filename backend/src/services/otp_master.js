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
  const { brandName, email } = inquiryData;
  const html = `<p>New inquiry from ${brandName} (${email})</p>`;

  return sendEmail({
    to: process.env.EMAIL_FROM || 'hello@influenziaclub.com',
    subject: 'New Brand Inquiry',
    html
  });
};
