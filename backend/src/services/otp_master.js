import nodemailer from 'nodemailer';
import validator from 'validator';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (options) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('******************************************');
    console.log('--- CRITICAL: OTP LOG START ---');
    console.log('To:', options.to);
    console.log('Subject:', options.subject);
    console.log('------------------------------------------');
    console.log('HTML CONTENT:', options.html);
    console.log('--- CRITICAL: OTP LOG END ---');
    console.log('******************************************');
    return { success: true, messageId: 'mock-id' };
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Influenzia Club <hello@influenziaclub.in>',
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendVerificationEmail = async (email, otp, name) => {
  const safeName = validator.escape(name);
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
  const safeName = validator.escape(name);
  const referralLink = `${process.env.REFERRAL_BASE_URL || 'https://influenziaclub.in/join?ref='}${validator.escape(referralCode)}`;
  
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
  const safeName = validator.escape(name);
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
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
    to: process.env.EMAIL_FROM || 'hello@influenziaclub.in',
    subject: 'New Brand Inquiry',
    html
  });
};
