import express from 'express';
import { z } from 'zod';
import { adminProtect, protect } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { env } from '../config/env.js';
import {
  createOrder,
  generateAgreement,
  generateInvoice,
  verifyPayment
} from '../services/paymentService.js';
import { findMatchingCreators } from '../services/matchmakingService.js';

const router = express.Router();

const requirePaymentsEnabled = (req, res, next) => {
  if (!env.paymentsEnabled) {
    return res.status(503).json({
      success: false,
      message: 'Online payments are not currently available'
    });
  }
  next();
};

router.post('/create-order', adminProtect, requirePaymentsEnabled, async (req, res) => {
  try {
    const input = z
      .object({
        brandInquiryId: z.string().uuid(),
        creatorId: z.string().uuid(),
        amount: z.coerce.number().positive().max(10_000_000)
      })
      .strict()
      .parse(req.body);

    const [inquiry, creator] = await Promise.all([
      prisma.brandInquiry.findUnique({ where: { id: input.brandInquiryId } }),
      prisma.creator.findUnique({ where: { id: input.creatorId } })
    ]);
    if (!inquiry || !creator) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry or creator not found'
      });
    }

    const platformFee = Number((input.amount * 0.1).toFixed(2));
    const creatorEarnings = Number((input.amount - platformFee).toFixed(2));
    const order = await createOrder(input.amount);
    const payment = await prisma.payment.create({
      data: {
        brandInquiryId: input.brandInquiryId,
        creatorId: input.creatorId,
        amount: input.amount,
        platformFee,
        creatorEarnings,
        status: 'initiated',
        razorpayOrderId: order.id
      }
    });

    res.status(201).json({
      success: true,
      order,
      payment: { id: payment.id, platformFee, creatorEarnings }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Invalid payment request' : 'Unable to create payment'
    });
  }
});

router.post('/verify-payment', adminProtect, requirePaymentsEnabled, async (req, res) => {
  try {
    const input = z
      .object({
        paymentId: z.string().uuid(),
        razorpay_payment_id: z.string().min(1).max(100),
        razorpay_signature: z.string().min(1).max(255)
      })
      .strict()
      .parse(req.body);

    const payment = await prisma.payment.findUnique({
      where: { id: input.paymentId },
      include: { brandInquiry: true, creator: true }
    });
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }
    if (payment.status === 'completed') {
      return res.json({ success: true, message: 'Payment already verified' });
    }
    if (
      !verifyPayment(
        payment.razorpayOrderId,
        input.razorpay_payment_id,
        input.razorpay_signature
      )
    ) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    const invoice = generateInvoice({
      brandName: payment.brandInquiry.brandName,
      brandGst: null,
      amount: Number(payment.amount),
      platformFee: Number(payment.platformFee)
    });
    const agreement = generateAgreement({
      brandName: payment.brandInquiry.brandName,
      creatorName: payment.creator.name,
      deliverables: 'As documented in the approved campaign brief',
      timeline: 'As documented in the approved campaign brief',
      paymentAmount: Number(payment.amount),
      paymentTerms: 'As documented in the approved campaign brief'
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        razorpayPaymentId: input.razorpay_payment_id,
        razorpaySignature: input.razorpay_signature,
        invoiceUrl: `data:text/html;base64,${Buffer.from(invoice.invoiceHtml).toString('base64')}`,
        agreementUrl: `data:text/html;base64,${Buffer.from(agreement.agreementHtml).toString('base64')}`,
        paidAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Payment verified',
      invoice: invoice.invoiceData,
      agreementId: agreement.agreementId
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Invalid verification request' : 'Unable to verify payment'
    });
  }
});

router.get('/invoice/:paymentId', protect, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId }
    });
    if (!payment?.invoiceUrl || payment.creatorId !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const html = Buffer.from(
      payment.invoiceUrl.replace('data:text/html;base64,', ''),
      'base64'
    ).toString('utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment.id}.html"`);
    res.send(html);
  } catch (error) {
    console.error('Invoice download error:', error);
    res.status(500).json({ success: false, message: 'Unable to download invoice' });
  }
});

router.post('/matches', adminProtect, async (req, res) => {
  try {
    const { brandInquiryId, limit } = z
      .object({
        brandInquiryId: z.string().uuid(),
        limit: z.coerce.number().int().min(1).max(50).default(10)
      })
      .parse(req.body);
    const inquiry = await prisma.brandInquiry.findUnique({
      where: { id: brandInquiryId }
    });
    if (!inquiry) {
      return res.status(404).json({ success: false, message: 'Inquiry not found' });
    }
    res.json(await findMatchingCreators(inquiry, limit));
  } catch (error) {
    res.status(error instanceof z.ZodError ? 400 : 500).json({
      success: false,
      message: error instanceof z.ZodError ? 'Invalid match request' : 'Unable to find matches'
    });
  }
});

router.all('/payout', protect, (req, res) => {
  res.status(503).json({
    success: false,
    message: 'Automated payouts are not available'
  });
});

router.get('/payouts', protect, async (req, res) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { creatorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, payouts });
  } catch (error) {
    console.error('Payout history error:', error);
    res.status(500).json({ success: false, message: 'Unable to load payouts' });
  }
});

router.get('/payments', protect, (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Brand payment accounts are not implemented'
  });
});

export default router;
