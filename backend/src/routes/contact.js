import express from 'express';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

// Submit contact form
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Forward to admin email
    await sendEmail({
      to: process.env.EMAIL_FROM || 'hello@influenziaclub.in',
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
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
