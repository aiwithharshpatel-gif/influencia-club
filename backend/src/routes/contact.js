import express from 'express';
import { sendEmail } from '../services/otp_master.js';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { env } from '../config/env.js';
import { escapeHtml, normalizeEmail } from '../utils/security.js';
import { safeErrorMessage } from '../middleware/errorHandler.js';

const router = express.Router();

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: 'Too many contact requests, please try again after an hour'
});

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(150),
  subject: z.string().min(2).max(200),
  message: z.string().min(10).max(2000)
}).strict();

// Submit contact form
router.post('/', contactLimiter, async (req, res) => {
  try {
    const validated = contactSchema.parse(req.body);
    const { name, email, subject, message } = validated;

    // Forward to admin email
    await sendEmail({
      to: env.supportEmail,
      replyTo: normalizeEmail(email),
      subject: `Contact form: ${subject.replace(/[\r\n]/g, ' ')}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(message).replaceAll('\n', '<br>')}</p>
      `
    });

    res.json({
      success: true,
      message: 'Thank you for contacting us. Your message has been received.'
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
      message: safeErrorMessage(error, env.isProduction)
    });
  }
});

export default router;
