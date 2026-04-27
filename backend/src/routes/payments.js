import express from 'express';
import { PrismaClient } from '@prisma/client';
import { protect } from '../middleware/auth.js';
import { createOrder, verifyPayment, initiatePayout, generateInvoice, generateAgreement } from '../services/paymentService.js';
import { findMatchingCreators } from '../services/matchmakingService.js';
import { debitPoints } from '../services/pointsService.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(protect);

/**
 * Create Razorpay Order
 */
router.post('/create-order', async (req, res) => {
  try {
    const { brandInquiryId, creatorId, amount } = req.body;

    if (!brandInquiryId || !creatorId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Calculate platform fee (10%)
    const platformFee = amount * 0.1;
    const creatorEarnings = amount - platformFee;

    // Create Razorpay order
    const orderResult = await createOrder(amount, 'INR');

    if (!orderResult.success) {
      return res.status(500).json({
        success: false,
        error: orderResult.error
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        brandInquiryId,
        creatorId,
        amount,
        platformFee,
        creatorEarnings,
        status: 'initiated',
        razorpayOrderId: orderResult.order.id
      }
    });

    res.json({
      success: true,
      order: orderResult.order,
      payment: {
        id: payment.id,
        amount,
        platformFee,
        creatorEarnings
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Verify Payment
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentId, razorpay_payment_id, razorpay_signature } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        brandInquiry: true,
        creator: true
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify Razorpay signature
    const verification = await verifyPayment(
      payment.razorpayOrderId,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!verification.success) {
      return res.status(400).json({
        success: false,
        message: verification.error
      });
    }

    // Update payment status
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'completed',
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        paidAt: new Date()
      }
    });

    // Generate invoice
    const invoice = await generateInvoice({
      brandName: payment.brandInquiry.brandName,
      brandGst: null, // Can be added to brand_inquiry schema
      amount: Number(payment.amount),
      platformFee: Number(payment.platformFee)
    });

    // Generate agreement
    const agreement = await generateAgreement({
      brandName: payment.brandInquiry.brandName,
      creatorName: payment.creator.name,
      deliverables: 'As per campaign brief',
      timeline: 'As per mutual agreement',
      paymentAmount: Number(payment.amount),
      paymentTerms: 'Within 7 days of content approval'
    });

    // Update payment with invoice and agreement URLs
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        invoiceUrl: `data:text/html;base64,${Buffer.from(invoice.invoiceHtml).toString('base64')}`,
        agreementUrl: `data:text/html;base64,${Buffer.from(agreement.agreementHtml).toString('base64')}`
      }
    });

    res.json({
      success: true,
      message: 'Payment verified successfully',
      invoice: invoice.invoiceData,
      agreementId: agreement.agreementId
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Initiate Payout to Creator
 */
router.post('/payout', async (req, res) => {
  try {
    // Creator can only request payout for themselves
    const creatorId = req.user.id;
    const { amount, upiId } = req.body;

    // Validate amount
    if (!Number.isInteger(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    if (amount < 100) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payout is 100 points'
      });
    }

    // Check creator balance
    const creator = await prisma.creator.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found'
      });
    }

    // Debit points (atomic transaction)
    try {
      await debitPoints(creatorId, amount, 'redemption', `Payout request of ${amount} points to ${upiId}`);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        creatorId,
        amount,
        paymentMethod: 'UPI',
        upiId,
        status: 'pending'
      }
    });

    // Initiate Cashfree payout
    const payoutResult = await initiatePayout({
      beneficiaryId: creatorId,
      name: creator.name,
      upiId
    }, amount);

    if (payoutResult.success) {
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          status: 'processing',
          cashfreePayoutId: payoutResult.payout.payoutId
        }
      });
    }

    res.json({
      success: true,
      message: 'Payout initiated',
      payout
    });
  } catch (error) {
    console.error('Payout error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get Creator Payout History
 */
router.get('/payouts', async (req, res) => {
  try {
    const payouts = await prisma.payout.findMany({
      where: { creatorId: req.user.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payouts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get Brand Payment History
 */
router.get('/payments', async (req, res) => {
  try {
    // Find all brand inquiries by this user (if they're a brand)
    // This would need brand user type - for now return empty
    res.json({
      success: true,
      payments: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Download Invoice
 */
router.get('/invoice/:paymentId', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        brandInquiry: true,
        creator: true
      }
    });

    if (!payment || !payment.invoiceUrl) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    // Ownership check: only the creator of this payment can download it
    // If you have admin role in req.user, check for that too
    if (payment.creatorId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const base64Content = payment.invoiceUrl.replace('data:text/html;base64,', '');
    const htmlContent = Buffer.from(base64Content, 'base64').toString('utf-8');

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${payment.id}.html"`);
    res.send(htmlContent);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get AI Creator Matches for Brand Inquiry
 */
router.post('/matches', async (req, res) => {
  try {
    const { brandInquiryId, limit = 10 } = req.body;

    const brandInquiry = await prisma.brandInquiry.findUnique({
      where: { id: brandInquiryId }
    });

    if (!brandInquiry) {
      return res.status(404).json({
        success: false,
        message: 'Brand inquiry not found'
      });
    }

    const matches = await findMatchingCreators(brandInquiry, limit);

    res.json(matches);
  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
