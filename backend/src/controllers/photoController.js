import {
  uploadPhotoToS3,
  listPhotosFromS3,
  getPhotoByKeyFromS3,
  deletePhotoFromS3,
  generateShareUrlFromS3,
  checkS3Health,
} from '../services/s3Service.js';

/**
 * POST /api/photos
 * Upload one or multiple photos to S3
 */
export const uploadPhotos = async (req, res, next) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No files provided',
        message: 'Please select at least one photo (JPG, PNG, WEBP) to upload.',
      });
    }

    const uploadPromises = files.map((file) =>
      uploadPhotoToS3({
        fileBuffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
      })
    );

    const uploadedPhotos = await Promise.all(uploadPromises);

    return res.status(201).json({
      message: `Successfully uploaded ${uploadedPhotos.length} photo${uploadedPhotos.length > 1 ? 's' : ''}`,
      photos: uploadedPhotos,
      count: uploadedPhotos.length,
    });
  } catch (error) {
    console.error('Error uploading photos to S3:', error);
    return res.status(error.statusCode || 500).json({
      error: 'Upload failed',
      message: error.message || 'Failed to upload photo to S3',
      code: error.name || 'S3_UPLOAD_ERROR',
    });
  }
};

/**
 * GET /api/photos
 * List all photos in S3
 */
export const getPhotos = async (req, res, next) => {
  try {
    const photos = await listPhotosFromS3();
    return res.status(200).json({
      photos,
      count: photos.length,
    });
  } catch (error) {
    console.error('Error fetching photos from S3:', error);
    const isConfigError =
      !process.env.S3_BUCKET_NAME ||
      error.message?.includes('S3_BUCKET_NAME') ||
      error.name === 'CredentialsProviderError';

    return res.status(isConfigError ? 503 : 500).json({
      error: 'Failed to retrieve photos',
      message: error.message || 'Unable to load photos from S3',
      isConfigured: !isConfigError,
      code: error.name || 'S3_RETRIEVAL_ERROR',
    });
  }
};

/**
 * GET /api/photos/:key
 * Get single photo details and fresh presigned URL
 */
export const getPhotoByKey = async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params.key);
    if (!key) {
      return res.status(400).json({ error: 'Photo key is required' });
    }

    const photo = await getPhotoByKeyFromS3(key);
    return res.status(200).json({ photo });
  } catch (error) {
    console.error(`Error fetching photo key "${req.params.key}":`, error);
    if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
      return res.status(404).json({
        error: 'Not found',
        message: 'The requested photo was not found in S3.',
      });
    }

    return res.status(500).json({
      error: 'Failed to fetch photo',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/photos/:key
 * Delete photo from S3
 */
export const deletePhoto = async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params.key);
    if (!key) {
      return res.status(400).json({ error: 'Photo key is required' });
    }

    await deletePhotoFromS3(key);
    return res.status(200).json({
      message: 'Photo deleted successfully',
      key,
    });
  } catch (error) {
    console.error(`Error deleting photo key "${req.params.key}":`, error);
    return res.status(500).json({
      error: 'Delete failed',
      message: error.message || 'Could not delete photo from S3',
    });
  }
};

/**
 * POST /api/photos/:key/share
 * Generate temporary pre-signed URL with custom expiration
 */
export const sharePhoto = async (req, res, next) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const { expiresIn } = req.body || {};

    if (!key) {
      return res.status(400).json({ error: 'Photo key is required' });
    }

    const shareData = await generateShareUrlFromS3(key, expiresIn || 600);
    return res.status(200).json({
      message: 'Temporary share URL created',
      ...shareData,
    });
  } catch (error) {
    console.error(`Error sharing photo key "${req.params.key}":`, error);
    return res.status(500).json({
      error: 'Share link generation failed',
      message: error.message,
    });
  }
};

/**
 * GET /api/health
 * Backend & S3 status check
 */
export const getHealth = async (req, res) => {
  const s3Status = await checkS3Health();
  res.status(200).json({
    status: 'ok',
    service: 'CloudPix Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    s3: s3Status,
  });
};
