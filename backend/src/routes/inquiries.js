import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Submit brand inquiry
router.post('/', async (req, res) => {
  try {
    const { brandName, email, mobile, budgetRange, categories, message } = req.body;

    const inquiry = await prisma.brandInquiry.create({
      data: {
        brandName,
        email,
        mobile,
        budgetRange,
        categories: JSON.stringify(categories),
        message
      }
    });

    // TODO: Send email notification to admin
    // TODO: Send WhatsApp alert to admin

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
