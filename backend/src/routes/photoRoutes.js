import express from 'express';
import {
  uploadPhotos,
  getPhotos,
  getPhotoByKey,
  deletePhoto,
  sharePhoto,
  getHealth,
} from '../controllers/photoController.js';
import { upload, handleUploadErrors } from '../middleware/upload.js';

const router = express.Router();

// Health check endpoint
router.get('/health', getHealth);

// POST /api/photos - Upload one or multiple photos
// Handles 'photos' field array or 'photo' single field
router.post(
  '/photos',
  handleUploadErrors(upload.array('photos', 10)),
  uploadPhotos
);

// GET /api/photos - List photos
router.get('/photos', getPhotos);

// POST /api/photos/:key/share - Generate share link
// Note: Placed before /:key to avoid route capture
router.post('/photos/:key(*)/share', sharePhoto);

// GET /api/photos/:key - Get single photo details
router.get('/photos/:key(*)', getPhotoByKey);

// DELETE /api/photos/:key - Delete photo
router.delete('/photos/:key(*)', deletePhoto);

export default router;
