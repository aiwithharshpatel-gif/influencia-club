import crypto from 'crypto';
import { env } from '../config/env.js';
import { escapeHtml } from '../utils/security.js';

const getRazorpayCredentials = () => {
  if (!env.paymentsEnabled) throw new Error('Payments are not enabled');
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured');
  }
  return Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
  ).toString('base64');
};

export const createOrder = async (amount, currency = 'INR') => {
  const amountInPaise = Math.round(Number(amount) * 100);
  if (!Number.isSafeInteger(amountInPaise) || amountInPaise < 100) {
    throw new Error('Invalid payment amount');
  }

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${getRazorpayCredentials()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      amount: amountInPaise,
      currency,
      receipt: `ic_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`
    }),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    throw new Error(`Razorpay order request failed with status ${response.status}`);
  }
  return response.json();
};

export const verifyPayment = (orderId, paymentId, signature) => {
  if (!env.paymentsEnabled || !process.env.RAZORPAY_KEY_SECRET) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  const receivedBuffer = Buffer.from(String(signature || ''));
  const expectedBuffer = Buffer.from(expected);

  return (
    receivedBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

export const generateInvoice = ({
  brandName,
  brandGst,
  amount,
  platformFee,
  gstRate = 18
}) => {
  const invoiceNumber = `INV-${Date.now()}`;
  const gstAmount = (amount * gstRate) / 100;
  const totalAmount = amount + gstAmount;
  const invoiceHtml = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>${invoiceNumber}</title></head>
      <body style="font-family:Arial,sans-serif;padding:40px">
        <h1>Influenzia Club</h1>
        <h2>Tax Invoice</h2>
        <p><strong>Invoice:</strong> ${invoiceNumber}</p>
        <p><strong>Date:</strong> ${new Date().toISOString().slice(0, 10)}</p>
        <p><strong>Bill to:</strong> ${escapeHtml(brandName)}</p>
        <p><strong>GSTIN:</strong> ${escapeHtml(brandGst || 'N/A')}</p>
        <hr>
        <p>Campaign services: INR ${amount.toFixed(2)}</p>
        <p>Platform fee: INR ${platformFee.toFixed(2)}</p>
        <p>GST (${gstRate}%): INR ${gstAmount.toFixed(2)}</p>
        <p><strong>Total: INR ${totalAmount.toFixed(2)}</strong></p>
      </body>
    </html>
  `;

  return {
    invoiceHtml,
    invoiceData: { invoiceNumber, amount, platformFee, gstAmount, totalAmount }
  };
};

export const generateAgreement = ({
  brandName,
  creatorName,
  deliverables,
  timeline,
  paymentAmount,
  paymentTerms
}) => {
  const agreementId = `AGR-${Date.now()}`;
  const agreementHtml = `
    <!doctype html>
    <html>
      <head><meta charset="utf-8"><title>${agreementId}</title></head>
      <body style="font-family:Arial,sans-serif;padding:40px;line-height:1.6">
        <h1>Influencer Collaboration Agreement</h1>
        <p><strong>Agreement:</strong> ${agreementId}</p>
        <p><strong>Brand:</strong> ${escapeHtml(brandName)}</p>
        <p><strong>Creator:</strong> ${escapeHtml(creatorName)}</p>
        <h2>Deliverables</h2><p>${escapeHtml(deliverables)}</p>
        <h2>Timeline</h2><p>${escapeHtml(timeline)}</p>
        <h2>Payment</h2>
        <p>INR ${Number(paymentAmount).toFixed(2)}</p>
        <p>${escapeHtml(paymentTerms)}</p>
      </body>
    </html>
  `;

  return { agreementHtml, agreementId };
};
