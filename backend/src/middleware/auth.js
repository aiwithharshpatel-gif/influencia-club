import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid role.'
      });
    }

    const user = await prisma.creator.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        isApproved: true,
        isVerified: true,
        status: true,
        passwordVersion: true
      }
    });

    if (!user || user.passwordVersion !== decoded.version) {
      return res.status(401).json({
        success: false,
        message: 'User not found or session expired'
      });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    next(error);
  }
};

export const adminProtect = async (req, res, next) => {
  try {
    const token = req.cookies?.adminToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No admin token provided.'
      });
    }

    const adminSecret = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, adminSecret);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Invalid admin role.'
      });
    }

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordVersion: true
      }
    });

    if (!admin || admin.passwordVersion !== decoded.version) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or session expired'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid admin token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Admin token expired'
      });
    }
    next(error);
  }
};

export const anyProtect = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.cookies?.adminToken || req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Try verifying as creator first
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded.role === 'creator') {
        const user = await prisma.creator.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, name: true, role: true, passwordVersion: true }
        });
        if (user && user.passwordVersion === decoded.version) {
          req.user = { ...user, role: 'creator' };
          return next();
        }
      }
    } catch (e) {
      // Ignore and try admin
    }

    // Try verifying as admin
    try {
      const adminSecret = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET;
      const decoded = jwt.verify(token, adminSecret);
      if (decoded.role === 'admin') {
        const admin = await prisma.admin.findUnique({
          where: { id: decoded.id },
          select: { id: true, email: true, name: true, role: true, passwordVersion: true }
        });
        if (admin && admin.passwordVersion === decoded.version) {
          req.user = { ...admin, role: 'admin' };
          return next();
        }
      }
    } catch (e) {
      // Both failed
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  } catch (error) {
    console.error(`[SECURITY] Authentication error in anyProtect: ${error.message}`);
    next(error);
  }
};
