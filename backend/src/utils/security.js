import crypto from 'crypto';

export const normalizeEmail = (value) => value.trim().toLowerCase();

export const normalizeInstagram = (value) =>
  value.trim().toLowerCase().replace(/^@/, '');

export const escapeHtml = (value = '') =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

export const hashOtp = (email, otp, secret) =>
  crypto
    .createHmac('sha256', secret)
    .update(`${normalizeEmail(email)}:${otp}`)
    .digest('hex');

export const createSessionToken = () => crypto.randomBytes(48).toString('base64url');

export const hashSessionToken = (token, secret) =>
  crypto.createHmac('sha256', secret).update(token).digest('hex');

export const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));

  return (
    leftBuffer.length === rightBuffer.length &&
    crypto.timingSafeEqual(leftBuffer, rightBuffer)
  );
};
