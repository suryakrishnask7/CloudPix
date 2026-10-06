import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'node:crypto';
import path from 'node:path';

// Configure S3 Client
// If AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are provided in env, use them.
// Otherwise, AWS SDK v3 falls back to the default credential provider chain
// (IAM Role on EC2, container credentials, or environment variables).
const buildS3Client = () => {
  const clientConfig = {
    region: process.env.AWS_REGION || 'us-east-1',
  };

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    clientConfig.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      ...(process.env.AWS_SESSION_TOKEN ? { sessionToken: process.env.AWS_SESSION_TOKEN } : {}),
    };
  }

  return new S3Client(clientConfig);
};

const s3Client = buildS3Client();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

/**
 * Sanitize filename to remove special characters and spaces
 */
const sanitizeFilename = (filename) => {
  const parsed = path.parse(filename);
  const safeName = parsed.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeExt = parsed.ext.toLowerCase();
  return `${safeName}${safeExt}`;
};

/**
 * Extract human-readable original filename from S3 key or metadata
 */
const extractFilename = (key, metadata = {}) => {
  if (metadata.originalname) {
    try {
      return decodeURIComponent(metadata.originalname);
    } catch {
      return metadata.originalname;
    }
  }
  // Fallback: strip "photos/" and the UUID prefix ("uuid-filename")
  const basename = key.replace(/^photos\//, '');
  const match = basename.match(/^[0-9a-fA-F-]{36}-(.*)$/);
  return match ? match[1] : basename;
};

/**
 * Upload single photo buffer to S3 under photos/
 */
export const uploadPhotoToS3 = async ({ fileBuffer, originalName, mimeType }) => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured in environment variables');
  }

  const safeName = sanitizeFilename(originalName);
  const uuid = crypto.randomUUID();
  const key = `photos/${uuid}-${safeName}`;

  const putCommand = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
    Metadata: {
      originalname: encodeURIComponent(originalName),
      uploadedat: new Date().toISOString(),
    },
  });

  await s3Client.send(putCommand);

  // Generate a pre-signed URL for immediate viewing (valid for 1 hour)
  const getCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });
  const accessUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });

  return {
    key,
    filename: originalName,
    size: fileBuffer.length,
    mimeType,
    lastModified: new Date().toISOString(),
    url: accessUrl,
  };
};

/**
 * List all photos in S3 bucket with 'photos/' prefix
 */
export const listPhotosFromS3 = async () => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured in environment variables');
  }

  const listCommand = new ListObjectsV2Command({
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: 'photos/',
  });

  const response = await s3Client.send(listCommand);
  const contents = response.Contents || [];

  // Filter out folder prefix key itself
  const photoObjects = contents.filter((item) => item.Key && item.Key !== 'photos/' && item.Size > 0);

  // Generate signed URLs in parallel
  const photos = await Promise.all(
    photoObjects.map(async (item) => {
      const getCommand = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: item.Key,
      });

      const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
      const filename = extractFilename(item.Key);

      return {
        key: item.Key,
        filename,
        size: item.Size,
        lastModified: item.LastModified ? item.LastModified.toISOString() : new Date().toISOString(),
        url,
      };
    })
  );

  // Sort descending by last modified (newest photos first)
  photos.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

  return photos;
};

/**
 * Get details & fresh presigned URL for a single photo by key
 */
export const getPhotoByKeyFromS3 = async (key) => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured in environment variables');
  }

  const headCommand = new HeadObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  const metadata = await s3Client.send(headCommand);

  const getCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
  const filename = extractFilename(key, metadata.Metadata);

  return {
    key,
    filename,
    size: metadata.ContentLength,
    mimeType: metadata.ContentType,
    lastModified: metadata.LastModified ? metadata.LastModified.toISOString() : null,
    url,
  };
};

/**
 * Delete photo from S3 by key
 */
export const deletePhotoFromS3 = async (key) => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured in environment variables');
  }

  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(deleteCommand);
  return { success: true, key };
};

/**
 * Generate a temporary shareable pre-signed URL with custom expiration
 * @param {string} key S3 Object key
 * @param {number} expiresInSeconds Duration in seconds (default 600 = 10 minutes)
 */
export const generateShareUrlFromS3 = async (key, expiresInSeconds = 600) => {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error('S3_BUCKET_NAME is not configured in environment variables');
  }

  const parsedDuration = parseInt(expiresInSeconds, 10);
  const safeDuration = isNaN(parsedDuration) || parsedDuration <= 0 ? 600 : Math.min(parsedDuration, 604800); // max 7 days

  const getCommand = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
  });

  const shareUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: safeDuration });

  return {
    key,
    shareUrl,
    expiresIn: safeDuration,
    expiresAt: new Date(Date.now() + safeDuration * 1000).toISOString(),
  };
};

/**
 * Check S3 connectivity and bucket configuration status
 */
export const checkS3Health = async () => {
  const bucketName = process.env.S3_BUCKET_NAME;
  const region = process.env.AWS_REGION || 'us-east-1';

  if (!bucketName) {
    return {
      status: 'unconfigured',
      message: 'S3_BUCKET_NAME is not set in backend/.env',
      bucket: null,
      region,
    };
  }

  try {
    const headBucket = new HeadBucketCommand({ Bucket: bucketName });
    await s3Client.send(headBucket);
    return {
      status: 'healthy',
      message: 'Connected to AWS S3 bucket successfully',
      bucket: bucketName,
      region,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message || 'Failed to connect to AWS S3',
      code: error.name || error.$metadata?.httpStatusCode,
      bucket: bucketName,
      region,
    };
  }
};
