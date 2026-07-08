import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { protect } from '../middleware/auth.js';
import { createOrder, verifyPayment, initiatePayout, checkPayoutStatus, generateInvoice, generateAgreement } from '../services/paymentService.js';
import { findMatchingCreators } from '../services/matchmakingService.js';
import { debitPoints } from '../services/pointsService.js';
import { createNotification } from '../services/notificationInboxService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Custom middleware supporting creator, brand and admin access for payments/invoices
const anyPaymentUserProtect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.cookies?.adminToken || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const adminSecret = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;
      decoded = jwt.verify(token, adminSecret);
    }

    if (decoded.role === 'brand') {
      req.brand = { email: decoded.email };
      return next();
    } else if (decoded.role === 'creator') {
      req.user = { id: decoded.id, email: decoded.email, role: 'creator' };
      return next();
    } else if (decoded.role === 'admin') {
      req.user = { id: decoded.id, email: decoded.email, role: 'admin' };
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied. Invalid role.'
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

/**
 * Create Razorpay Order
 */
router.post('/create-order', anyPaymentUserProtect, async (req, res) => {
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
router.post('/verify-payment', anyPaymentUserProtect, async (req, res) => {
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

    // Verify Razorpay signature (with test bypass for E2E automation)
    let isVerified = false;
    if (process.env.NODE_ENV !== 'production' && (req.headers['x-test-bypass'] === 'true' || razorpay_payment_id?.startsWith('pay_mock'))) {
      isVerified = true;
    } else {
      const verification = await verifyPayment(
        payment.razorpayOrderId,
        razorpay_payment_id,
        razorpay_signature
      );
      isVerified = verification.success;
    }

    if (!isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
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

    // Notify creator and brand
    const io = req.app.get('io');
    await createNotification({
      recipientId: payment.creatorId,
      recipientType: 'creator',
      type: 'payment',
      title: 'Escrow Deposited 💰',
      message: `Brand "${payment.brandInquiry.brandName}" has deposited ₹${payment.amount} in escrow for your collaboration.`,
      link: '/dashboard/collabs'
    }, io);

    await createNotification({
      recipientId: payment.brandInquiry.email,
      recipientType: 'brand',
      type: 'payment',
      title: 'Escrow Payment Verified ✅',
      message: `Your escrow payment of ₹${payment.amount} for creator "${payment.creator.name}" has been successfully verified.`,
      link: '/brand/dashboard/inquiries'
    }, io);

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
router.post('/payout', protect, async (req, res) => {
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

    const io = req.app.get('io');
    await createNotification({
      recipientId: creatorId,
      recipientType: 'creator',
      type: 'payout',
      title: 'Payout Initiated 💸',
      message: `Your payout request of ₹${amount} (UPI: ${upiId}) is being processed.`,
      link: '/dashboard/points'
    }, io);

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
router.get('/payouts', protect, async (req, res) => {
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
 * Get Brand / Creator Payment History
 */
router.get('/payments', anyPaymentUserProtect, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: req.brand 
        ? { brandInquiry: { email: req.brand.email } } 
        : (req.user.role === 'admin' ? {} : { creatorId: req.user.id }),
      include: {
        brandInquiry: true,
        creator: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      payments
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
router.get('/invoice/:paymentId', anyPaymentUserProtect, async (req, res) => {
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

    // Authorization check
    const isAuthorized = 
      (req.brand && payment.brandInquiry.email === req.brand.email) ||
      (req.user && (payment.creatorId === req.user.id || req.user.role === 'admin'));

    if (!isAuthorized) {
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

/**
 * Check Payout Status (polls Cashfree)
 * GET /api/payments/payout/:id/status
 */
router.get('/payout/:id/status', protect, async (req, res) => {
  try {
    const payout = await prisma.payout.findUnique({
      where: { id: req.params.id }
    });

    if (!payout) {
      return res.status(404).json({
        success: false,
        message: 'Payout not found'
      });
    }

    // Only the creator who owns this payout can check status
    if (payout.creatorId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // If we have a Cashfree transfer ID, check live status
    const transferId = payout.cashfreePayoutId;
    if (transferId) {
      const statusResult = await checkPayoutStatus(transferId);

      if (statusResult.success) {
        // Map Cashfree status to our status
        let mappedStatus = payout.status;
        if (statusResult.status === 'SUCCESS') {
          mappedStatus = 'completed';
        } else if (statusResult.status === 'FAILED' || statusResult.status === 'REVERSED') {
          mappedStatus = 'failed';
        } else if (statusResult.status === 'PENDING') {
          mappedStatus = 'processing';
        }

        // Update local record if status changed
        if (mappedStatus !== payout.status) {
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              status: mappedStatus,
              processedAt: mappedStatus === 'completed' ? new Date() : payout.processedAt
            }
          });

          // Notify creator
          const io = req.app.get('io');
          if (mappedStatus === 'completed') {
            await createNotification({
              recipientId: payout.creatorId,
              recipientType: 'creator',
              type: 'payout',
              title: 'Payout Successful! ✅',
              message: `Your payout of ₹${payout.amount} has been successfully credited to your account.`,
              link: '/dashboard/points'
            }, io);
          } else if (mappedStatus === 'failed') {
            await createNotification({
              recipientId: payout.creatorId,
              recipientType: 'creator',
              type: 'payout',
              title: 'Payout Failed ❌',
              message: `Your payout of ₹${payout.amount} has failed. Please check your payment details.`,
              link: '/dashboard/points'
            }, io);
          }
        }

        return res.json({
          success: true,
          payout: {
            id: payout.id,
            amount: payout.amount,
            status: mappedStatus,
            cashfreeStatus: statusResult.status,
            utr: statusResult.utr,
            transferId,
            processedAt: mappedStatus === 'completed' ? new Date() : payout.processedAt
          }
        });
      }
    }

    // No Cashfree ID or check failed — return local status
    res.json({
      success: true,
      payout: {
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        cashfreeStatus: null,
        transferId: payout.cashfreePayoutId,
        processedAt: payout.processedAt
      }
    });
  } catch (error) {
    console.error('Payout status check error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
