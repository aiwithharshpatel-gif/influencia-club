import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';

/**
 * Upload Service
 * Configures Cloudinary and provides file upload utilities for chat attachments
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Multer configuration for in-memory file storage
 * Max file size: 5MB
 */
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Supported: JPEG, PNG, GIF, WebP, PDF, DOC, DOCX'), false);
    }
  }
});

/**
 * Upload a file buffer to Cloudinary
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Cloudinary folder name
 * @param {string} resourceType - 'image' | 'raw' (for PDFs/docs)
 * @returns {Promise<{url: string, publicId: string, format: string, bytes: number}>}
 */
export const uploadToCloudinary = (buffer, folder = 'influenzia-chat', resourceType = 'auto') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        transformation: resourceType === 'image' ? [
          { quality: 'auto', fetch_format: 'auto' }
        ] : undefined
      },
      (error, result) => {
        if (error) {
          console.error('[Upload Service] Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height
          });
        }
      }
    );
    stream.end(buffer);
  });
};

export default cloudinary;
