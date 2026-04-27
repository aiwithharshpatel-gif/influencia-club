import prisma from '../lib/prisma.js';

export const safeErrorMessage = (error, isProduction = false) => {
  if (isProduction) {
    console.error('Internal error:', error.message, error.stack);
    return 'An unexpected error occurred';
  }
  return error.message;
};

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists'
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Record not found'
    });
  }

  // Default error
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProduction ? 'An unexpected error occurred' : err.message
  });
};

export const validateCreator = async (req, res, next) => {
  const { email, instagram, mobile } = req.body;

  // Check if email already exists
  const existingEmail = await prisma.creator.findUnique({
    where: { email }
  });

  if (existingEmail) {
    return res.status(409).json({
      success: false,
      message: 'Email already registered'
    });
  }

  // Check if Instagram handle already exists
  const existingInstagram = await prisma.creator.findFirst({
    where: { instagram: instagram.toLowerCase() }
  });

  if (existingInstagram) {
    return res.status(409).json({
      success: false,
      message: 'Instagram handle already registered'
    });
  }

  next();
};
