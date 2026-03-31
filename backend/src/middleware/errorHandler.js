import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
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
