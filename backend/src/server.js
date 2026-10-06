import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import photoRoutes from './routes/photoRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || origin.startsWith('http://localhost:')) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked request from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root welcome & API info
app.get('/', (req, res) => {
  res.json({
    name: 'CloudPix API',
    version: '1.0.0',
    description: 'Cloud Photo Gallery Backend connecting to AWS S3',
    endpoints: {
      health: 'GET /api/health',
      listPhotos: 'GET /api/photos',
      uploadPhotos: 'POST /api/photos',
      getPhoto: 'GET /api/photos/:key',
      deletePhoto: 'DELETE /api/photos/:key',
      sharePhoto: 'POST /api/photos/:key/share',
    },
    documentation: 'See README.md for setup instructions and AWS configuration.',
  });
});

// Mount photo routes
app.use('/api', photoRoutes);

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'An unexpected error occurred',
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`☁️  CloudPix Backend running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
  console.log(`🪣 S3 Bucket: ${process.env.S3_BUCKET_NAME || '(Not configured in .env)'}`);
  console.log(`===============================================`);
});
