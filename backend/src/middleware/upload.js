import multer from 'multer';

// Use MemoryStorage: files are kept as in-memory Buffers and NEVER stored permanently on disk
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// File filter validation
const fileFilter = (req, file, cb) => {
  const mimeType = file.mimetype.toLowerCase();
  if (ALLOWED_MIME_TYPES.includes(mimeType)) {
    cb(null, true);
  } else {
    const error = new Error(
      `Unsupported file type: ${file.mimetype}. Allowed types: JPG, JPEG, PNG, WEBP.`
    );
    error.statusCode = 400;
    cb(error, false);
  }
};

// 20 MB max file size
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 10, // Max 10 images at once
  },
  fileFilter,
});

/**
 * Middleware wrapper to handle Multer errors gracefully
 */
export const handleUploadErrors = (uploadMiddleware) => (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File too large',
          message: `File size exceeds the 20MB limit.`,
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Too many files',
          message: 'You can upload up to 10 photos simultaneously.',
        });
      }
      return res.status(400).json({
        error: 'Upload error',
        message: err.message,
      });
    }

    return res.status(err.statusCode || 400).json({
      error: 'Invalid file upload',
      message: err.message || 'File validation failed',
    });
  });
};
