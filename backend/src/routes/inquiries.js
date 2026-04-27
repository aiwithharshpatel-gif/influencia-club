import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import validator from 'validator';
import { sendInquiryNotificationEmail } from '../services/emailService.js';

const router = express.Router();
const prisma = new PrismaClient();

const inquirySchema = z.object({
  brandName: z.string().min(1).max(200),
  email: z.string().email(),
  mobile: z.string().regex(/^\d{10}$/, 'Mobile must be 10 digits'),
  budgetRange: z.enum(['10k-50k', '50k-1L', '1L-5L', '5L+']),
  categories: z.array(z.string()).min(1),
  message: z.string().min(1).max(2000)
});

// Submit brand inquiry
router.post('/', async (req, res) => {
  try {
    const validated = inquirySchema.parse(req.body);
    const { brandName, email, mobile, budgetRange, categories, message } = validated;

    const inquiry = await prisma.brandInquiry.create({
      data: {
        brandName: validator.escape(brandName),
        email,
        mobile,
        budgetRange,
        categories: JSON.stringify(categories),
        message: validator.escape(message)
      }
    });

    // Send email notification to admin
    await sendInquiryNotificationEmail({
      brandName,
      email,
      mobile,
      budgetRange,
      categories: categories.join(', '),
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
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
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
