import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import validator from 'validator';
import { sendInquiryNotificationEmail } from '../services/otp_master.js';

const router = express.Router();
const prisma = new PrismaClient();

const normalizeBudget = (val) => {
  if (typeof val === 'string') {
    let s = val.trim();
    try {
      s = validator.unescape(s);
      s = validator.unescape(s);
    } catch (e) {}
    return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  }
  return val;
};

const inquirySchema = z.object({
  brandName: z.string().min(1, 'Brand name is required').max(200),
  email: z.string().email('Please enter a valid email address'),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  budgetRange: z.preprocess(
    normalizeBudget,
    z.enum(['<5000', '5000-15000', '15000-30000', '30000-50000', '50000+'])
  ),
  categories: z.array(z.string()).min(1, 'Please select at least one category'),
  message: z.string().max(2000).optional().default('')
});

// Submit brand inquiry
router.post('/', async (req, res) => {
  try {
    const rawBody = {
      ...req.body,
      budgetRange: normalizeBudget(req.body.budgetRange)
    };
    const validated = inquirySchema.parse(rawBody);
    const { brandName, email, mobile, budgetRange, categories, message } = validated;
    const normalizedEmail = email.toLowerCase().trim();

    const inquiry = await prisma.brandInquiry.create({
      data: {
        brandName: validator.unescape(brandName).trim(),
        email: normalizedEmail,
        mobile,
        budgetRange,
        categories,
        message: message ? validator.unescape(message).trim() : ''
      }
    });

    // Send email notification to admin & confirmation to brand
    await sendInquiryNotificationEmail({
      brandName: inquiry.brandName,
      email: normalizedEmail,
      mobile,
      budgetRange,
      categories,
      message
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
      const fieldErrors = error.issues.map(issue => {
        const field = issue.path.join('.');
        return `${field}: ${issue.message}`;
      });
      return res.status(400).json({
        success: false,
        message: fieldErrors[0] || 'Validation failed',
        errors: fieldErrors
      });
    }
    res.status(500).json({
      success: false,
      message: 'An error occurred while submitting your inquiry. Please try again.'
    });
  }
});

// Get inquiry status (optional, for future)
router.get('/:id', async (req, res) => {
  try {
    const inquiry = await prisma.brandInquiry.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        brandName: true,
        email: true,
        status: true,
        createdAt: true
      }
    });

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }

    res.json({
      success: true,
      inquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
