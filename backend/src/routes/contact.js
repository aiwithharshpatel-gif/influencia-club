import express from 'express';
import { sendEmail } from '../services/otp_master.js';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many contact requests, please try again after an hour'
});

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000)
});

// Submit contact form
router.post('/', contactLimiter, async (req, res) => {
  try {
    const validated = contactSchema.parse(req.body);
    const { name, email, subject, message } = validated;

    // Forward to admin email
    await sendEmail({
      to: process.env.EMAIL_FROM || 'hello@influenziaclub.com',
      subject: `Contact Form: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `
    });

    res.json({
      success: true,
      message: 'Thank you for contacting us! We will get back to you within 24 hours.'
    });
  } catch (error) {
    console.error('Contact error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.issues
      });
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
