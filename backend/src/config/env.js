const isProduction = process.env.NODE_ENV === 'production';

const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

if (isProduction) {
  required.push(
    'JWT_ADMIN_SECRET',
    'FRONTEND_URL',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'EMAIL_FROM'
  );
}

const missing = required.filter((name) => !process.env[name]?.trim());

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_ADMIN_SECRET']) {
  const value = process.env[name];
  if (value && value.length < 32) {
    throw new Error(`${name} must be at least 32 characters`);
  }
}

const frontendOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

export const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number.parseInt(process.env.PORT || '5000', 10),
  frontendOrigins,
  referralBaseUrl:
    process.env.REFERRAL_BASE_URL ||
    `${frontendOrigins[0] || 'http://localhost:5173'}/join?ref=`,
  otpSecret: process.env.OTP_SECRET || process.env.JWT_REFRESH_SECRET,
  smtp: {
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || '465', 10),
    secure:
      process.env.SMTP_SECURE === 'true' ||
      (!process.env.SMTP_SECURE && Number.parseInt(process.env.SMTP_PORT || '465', 10) === 465),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'Influenzia Club <no-reply@influenziaclub.com>',
    replyTo: process.env.EMAIL_REPLY_TO || process.env.SMTP_USER
  },
  supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER,
  paymentsEnabled: process.env.PAYMENTS_ENABLED === 'true',
  payoutsEnabled: process.env.PAYOUTS_ENABLED === 'true'
});
