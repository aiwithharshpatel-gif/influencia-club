import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Upload Service
 * Configures Cloudinary and provides local disk fallback for avatars and chat attachments
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Save file buffer directly to local persistent disk
 * @param {Buffer} buffer 
 * @param {string} folder 
 * @param {string} mimeType 
 * @returns {string|null} Relative URL path e.g. /api/uploads/profiles/xyz.jpg
 */
export const saveFileLocally = (buffer, folder = 'profiles', mimeType = 'image/jpeg') => {
  try {
    const cleanFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '');
    const targetDir = path.join(UPLOADS_DIR, cleanFolder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const extMap = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };
    const ext = extMap[mimeType] || mimeType.split('/')[1]?.replace(/[^a-zA-Z0-9]/g, '') || 'jpg';
    const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filePath = path.join(targetDir, filename);

    fs.writeFileSync(filePath, buffer);
    return `/api/uploads/${cleanFolder}/${filename}`;
  } catch (err) {
    console.error('[Upload Service] Local disk save error:', err);
    return null;
  }
};

/**
 * Multer configuration for in-memory file storage
 * Max file size: 10MB
 */
const storage = multer.memoryStorage();
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
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
 * Upload a file buffer to Cloudinary with local disk fallback
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Folder name
 * @param {string} resourceType - 'image' | 'raw' (for PDFs/docs)
 * @param {string} mimeType - File mime type
 * @returns {Promise<{url: string, publicId: string, format: string, bytes: number, width?: number, height?: number}>}
 */
export const uploadToCloudinary = (buffer, folder = 'influenzia-chat', resourceType = 'auto', mimeType = 'image/jpeg') => {
  return new Promise((resolve, reject) => {
    const hasCloudinary = process.env.CLOUDINARY_API_KEY && 
                          !process.env.CLOUDINARY_API_KEY.includes('your_') && 
                          process.env.CLOUDINARY_CLOUD_NAME;

    // Helper to produce local URL or data URI fallback
    const fallbackLocalOrData = () => {
      const localUrl = saveFileLocally(buffer, folder, mimeType);
      if (localUrl) {
        return resolve({
          url: localUrl,
          publicId: `local_${Date.now()}`,
          format: mimeType.split('/')[1] || 'jpg',
          bytes: buffer.length,
          width: 400,
          height: 400
        });
      }
      // Absolute fallback: data URI
      const base64Data = buffer.toString('base64');
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return resolve({
        url: dataUrl,
        publicId: `fallback_${Date.now()}`,
        format: mimeType.split('/')[1] || 'jpg',
        bytes: buffer.length,
        width: 400,
        height: 400
      });
    };

    if (!hasCloudinary) {
      return fallbackLocalOrData();
    }

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
          console.warn('[Upload Service] Cloudinary upload error, using local fallback:', error.message);
          return fallbackLocalOrData();
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          format: result.format,
          bytes: result.bytes,
          width: result.width,
          height: result.height
        });
      }
    );
    stream.end(buffer);
  });
};

export default cloudinary;


