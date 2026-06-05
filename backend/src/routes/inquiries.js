import express from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import { sendInquiryNotificationEmail } from '../services/otp_master.js';
import prisma from '../lib/prisma.js';
import { safeErrorMessage } from '../middleware/errorHandler.js';
import { env } from '../config/env.js';

const router = express.Router();

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many inquiries. Please try again later.' }
});

const inquirySchema = z.object({
  brandName: z.string().min(2).max(150),
  email: z.string().email().max(150),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  budgetRange: z.enum(['<5000', '5000-15000', '15000-30000', '30000-50000', '50000+']),
  categories: z
    .array(z.enum(['influencer', 'actor', 'model', 'creator', 'public_figure']))
    .min(1)
    .max(5),
  message: z.string().min(10).max(2000)
}).strict();

// Submit brand inquiry
router.post('/', inquiryLimiter, async (req, res) => {
  try {
    const validated = inquirySchema.parse(req.body);
    const { brandName, email, mobile, budgetRange, categories, message } = validated;

    const inquiry = await prisma.brandInquiry.create({
      data: {
        brandName,
        email: email.toLowerCase(),
        mobile,
        budgetRange,
        categories,
        message
      }
    });

    sendInquiryNotificationEmail({
      brandName,
      email,
      mobile,
      budgetRange,
      categories: categories.join(', '),
      message
    }).catch((error) => {
      console.error(`Inquiry notification failed for ${inquiry.id}: ${error.message}`);
    });

    res.json({
      success: true,
      message: 'Inquiry submitted successfully! We will get back to you within 48 hours.',
      inquiry: {
        id: inquiry.id,
        brandName: inquiry.brandName,
        status: inquiry.status
      }
    });
  } catch (error) {
    console.error('Inquiry error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues
      });
    }
    res.status(500).json({
      success: false,
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

export default router;
