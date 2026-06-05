import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { escapeHtml } from '../utils/security.js';

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.secure,
  auth:
    env.smtp.user && env.smtp.pass
      ? {
          user: env.smtp.user,
          pass: env.smtp.pass
        }
      : undefined,
  pool: env.isProduction,
  maxConnections: 3,
  maxMessages: 100,
  connectionTimeout: 15_000,
  greetingTimeout: 15_000,
  socketTimeout: 30_000,
  tls: {
    minVersion: 'TLSv1.2'
  }
});

export const verifyEmailTransport = async () => {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    if (env.isProduction) {
      throw new Error('SMTP is not fully configured');
    }
    console.warn('SMTP is not configured; development emails will be logged');
    return false;
  }

  await transporter.verify();
  console.log(`SMTP connection verified for ${env.smtp.host}:${env.smtp.port}`);
  return true;
};

export const sendEmail = async ({ to, subject, html, text, replyTo }) => {
  if (!env.smtp.host || !env.smtp.user || !env.smtp.pass) {
    if (env.isProduction) {
      throw new Error('Email service is unavailable');
    }
    console.log(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, messageId: 'development-email' };
  }

  const info = await transporter.sendMail({
    from: env.smtp.from,
    to,
    subject,
    html,
    text,
    replyTo: replyTo || env.smtp.replyTo
  });

  return { success: true, messageId: info.messageId };
};

export const sendVerificationEmail = (email, otp, name) =>
  sendEmail({
    to: email,
    subject: 'Verify your email - Influenzia Club',
    text: `Hi ${name}, your Influenzia Club verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2>Welcome, ${escapeHtml(name)}</h2>
        <p>Use this verification code to complete your registration:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:6px">${escapeHtml(otp)}</p>
        <p>This code expires in 10 minutes. Do not share it with anyone.</p>
      </div>
    `
  });

export const sendWelcomeEmail = (email, name, referralCode) => {
  const referralLink = `${env.referralBaseUrl}${encodeURIComponent(referralCode)}`;

  return sendEmail({
    to: email,
    subject: 'Welcome to Influenzia Club',
    text: `Welcome, ${name}. Your referral link is ${referralLink}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
        <h2>Welcome to Influenzia Club, ${escapeHtml(name)}</h2>
        <p>Your account is ready.</p>
        <p>Your referral link:</p>
        <p><a href="${escapeHtml(referralLink)}">${escapeHtml(referralLink)}</a></p>
      </div>
    `
  });
};

export const sendPasswordResetEmail = (email, token, name) => {
  const resetLink = `${env.frontendOrigins[0]}/reset-password?token=${encodeURIComponent(token)}`;

  return sendEmail({
    to: email,
    subject: 'Reset your password - Influenzia Club',
    text: `Hi ${name}, reset your password using this link: ${resetLink}. It expires in 30 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px">
        <p>Hi ${escapeHtml(name)},</p>
        <p>Use the button below to reset your password. This link expires in 30 minutes.</p>
        <p><a href="${escapeHtml(resetLink)}">Reset password</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
};

export const sendInquiryNotificationEmail = (inquiryData) =>
  sendEmail({
    to: env.supportEmail,
    replyTo: inquiryData.email,
    subject: `New brand inquiry: ${inquiryData.brandName}`,
    text: [
      `Brand: ${inquiryData.brandName}`,
      `Email: ${inquiryData.email}`,
      `Mobile: ${inquiryData.mobile}`,
      `Budget: ${inquiryData.budgetRange}`,
      `Categories: ${inquiryData.categories}`,
      `Message: ${inquiryData.message}`
    ].join('\n'),
    html: `
      <h2>New brand inquiry</h2>
      <p><strong>Brand:</strong> ${escapeHtml(inquiryData.brandName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(inquiryData.email)}</p>
      <p><strong>Mobile:</strong> ${escapeHtml(inquiryData.mobile)}</p>
      <p><strong>Budget:</strong> ${escapeHtml(inquiryData.budgetRange)}</p>
      <p><strong>Categories:</strong> ${escapeHtml(inquiryData.categories)}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(inquiryData.message).replaceAll('\n', '<br>')}</p>
    `
  });
