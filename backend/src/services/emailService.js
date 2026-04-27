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
  const mailOptions = {
    from: process.env.EMAIL_FROM || 'Influenzia Club <hello@influenziaclub.in>',
    to: options.to,
    subject: options.subject,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

export const sendVerificationEmail = async (email, otp, name) => {
  const safeName = validator.escape(name);
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(123, 47, 255, 0.15); }
        .header { background: linear-gradient(135deg, #7B2FFF 0%, #A66FFF 100%); padding: 40px 30px; text-align: center; }
        .logo { color: #FFFFFF; font-family: 'Playfair Display', serif; font-size: 32px; font-weight: bold; }
        .logo span { color: #F5A623; font-style: italic; }
        .tagline { color: rgba(255,255,255,0.9); font-size: 14px; margin-top: 8px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 16px; font-family: 'Playfair Display', serif; }
        .message { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .otp-box { background: linear-gradient(135deg, rgba(123, 47, 255, 0.08) 0%, rgba(166, 111, 255, 0.08) 100%); border: 2px dashed #7B2FFF; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 36px; font-weight: bold; color: #7B2FFF; letter-spacing: 8px; font-family: monospace; }
        .expiry { color: #999; font-size: 12px; margin-top: 8px; }
        .footer { background: #f9f9f9; padding: 24px 30px; text-align: center; }
        .footer-text { color: #999; font-size: 12px; line-height: 1.6; }
        .powered { color: #7B2FFF; font-weight: 600; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Influen<span>zia</span> Club</div>
          <div class="tagline">Influence. Inspire. Ignite.</div>
        </div>
        <div class="content">
          <div class="greeting">Welcome, ${safeName}! 🎉</div>
          <div class="message">
            Thank you for joining Influenzia Club - India's Next-Gen Influencer Platform!<br><br>
            To complete your registration, please use the following One-Time Password (OTP):
          </div>
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <div class="expiry">Valid for 10 minutes</div>
          </div>
          <div class="message">
            If you didn't request this verification, please ignore this email.
          </div>
        </div>
        <div class="footer">
          <div class="footer-text">
            This email was sent by Influenzia Club<br>
            Ahmedabad, Gujarat, India
          </div>
          <div class="powered">Powered by ZCAD Nexoraa Pvt. Ltd.</div>
        </div>
      </div>
    </body>
    </html>
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
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(123, 47, 255, 0.15); }
        .header { background: linear-gradient(135deg, #7B2FFF 0%, #A66FFF 100%); padding: 40px 30px; text-align: center; }
        .logo { color: #FFFFFF; font-family: 'Playfair Display', serif; font-size: 32px; font-weight: bold; }
        .logo span { color: #F5A623; font-style: italic; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 16px; font-family: 'Playfair Display', serif; }
        .message { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .referral-box { background: linear-gradient(135deg, rgba(123, 47, 255, 0.08) 0%, rgba(166, 111, 255, 0.08) 100%); border: 2px solid #7B2FFF; border-radius: 8px; padding: 24px; margin: 24px 0; }
        .referral-label { color: #7B2FFF; font-weight: 600; margin-bottom: 12px; }
        .referral-link { background: #fff; padding: 12px; border-radius: 6px; font-family: monospace; color: #7B2FFF; word-break: break-all; }
        .points-info { background: #f9f9f9; padding: 16px; border-radius: 8px; margin-top: 16px; }
        .points-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
        .points-item:last-child { border-bottom: none; }
        .points-value { color: #7B2FFF; font-weight: 600; }
        .footer { background: #f9f9f9; padding: 24px 30px; text-align: center; }
        .footer-text { color: #999; font-size: 12px; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Influen<span>zia</span> Club</div>
        </div>
        <div class="content">
          <div class="greeting">Welcome to the Club, ${safeName}! 🌟</div>
          <div class="message">
            You're now part of India's fastest-growing creator community!<br><br>
            Your profile is being reviewed and will be live soon.
          </div>
          <div class="referral-box">
            <div class="referral-label">🎁 Your Referral Link</div>
            <div class="referral-link">${referralLink}</div>
            <div class="points-info">
              <div class="points-item">
                <span>Signup Bonus</span>
                <span class="points-value">+10 pts</span>
              </div>
              <div class="points-item">
                <span>Per Referral</span>
                <span class="points-value">+50 pts</span>
              </div>
              <div class="points-item">
                <span>5-Referral Bonus</span>
                <span class="points-value">+100 pts</span>
              </div>
            </div>
          </div>
          <div class="message">
            Start sharing your link and earn points for amazing rewards!
          </div>
        </div>
        <div class="footer">
          <div class="footer-text">Powered by ZCAD Nexoraa Pvt. Ltd.</div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Influenzia Club! 🚀',
    html
  });
};

export const sendPasswordResetEmail = async (email, token, name) => {
  const safeName = validator.escape(name);
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'DM Sans', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(123, 47, 255, 0.15); }
        .header { background: linear-gradient(135deg, #7B2FFF 0%, #A66FFF 100%); padding: 40px 30px; text-align: center; }
        .logo { color: #FFFFFF; font-family: 'Playfair Display', serif; font-size: 32px; font-weight: bold; }
        .logo span { color: #F5A623; font-style: italic; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #1a1a1a; margin-bottom: 16px; font-family: 'Playfair Display', serif; }
        .message { color: #666; line-height: 1.6; margin-bottom: 24px; }
        .btn-container { text-align: center; margin: 30px 0; }
        .btn { background: #7B2FFF; color: #ffffff !important; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block; }
        .footer { background: #f9f9f9; padding: 24px 30px; text-align: center; }
        .footer-text { color: #999; font-size: 12px; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Influen<span>zia</span> Club</div>
        </div>
        <div class="content">
          <div class="greeting">Hi ${safeName},</div>
          <div class="message">
            We received a request to reset your password. Click the button below to choose a new one. This link will expire in 24 hours.
          </div>
          <div class="btn-container">
            <a href="${resetLink}" class="btn">Reset Password</a>
          </div>
          <div class="message">
            If you didn't request this, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          <div class="footer-text">Powered by ZCAD Nexoraa Pvt. Ltd.</div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Reset Your Password - Influenzia Club',
    html
  });
};

export const sendInquiryNotificationEmail = async (inquiryData) => {
  const { brandName, email, mobile, budgetRange, categories, message } = inquiryData;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: sans-serif; padding: 20px; line-height: 1.6; }
        .container { max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px; }
        .header { border-bottom: 2px solid #7B2FFF; padding-bottom: 10px; margin-bottom: 20px; }
        .field { margin-bottom: 10px; }
        .label { font-weight: bold; color: #7B2FFF; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>New Brand Inquiry</h2>
        </div>
        <div class="field"><span class="label">Brand:</span> ${brandName}</div>
        <div class="field"><span class="label">Email:</span> ${email}</div>
        <div class="field"><span class="label">Mobile:</span> ${mobile}</div>
        <div class="field"><span class="label">Budget:</span> ${budgetRange}</div>
        <div class="field"><span class="label">Categories:</span> ${categories}</div>
        <div class="field">
          <span class="label">Message:</span><br>
          ${message}
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: process.env.EMAIL_FROM || 'hello@influenziaclub.in',
    subject: `New Brand Inquiry: ${brandName}`,
    html
  });
};
