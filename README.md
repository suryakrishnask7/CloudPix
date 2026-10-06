# CloudPix — Cloud Photo Gallery

**CloudPix** is a full-stack, Pinterest-style cloud photo gallery inspired by Google Photos. It provides seamless photo uploads, pre-signed temporary link sharing, responsive masonry viewing, favorites, search, and permanent deletion backed directly by **Amazon Simple Storage Service (AWS S3)**.

---

## 📸 Features

- **Pinterest-Style Masonry Layout**: Preserves natural photo aspect ratios across responsive columns (desktop, tablet, and mobile).
- **Modern Light UI**: Clean, light aesthetic inspired by Google Photos and modern photo applications with smooth hover interactions.
- **Drag & Drop Multi-Upload**: Drag and drop or browse multiple images (`.jpg`, `.jpeg`, `.png`, `.webp`) with client-side MIME & 20MB file size validation, progress bars, and queue previews.
- **Private Amazon S3 Storage**: Photos are stored securely under `photos/` in a private S3 bucket. Access is mediated via pre-signed S3 URLs generated on-demand by the backend.
- **Pre-signed Link Sharing**: Generate secure, temporary share links with configurable expiration (10 minutes, 1 hour, 24 hours, or 7 days) and 1-click clipboard copying.
- **Lightbox Photo Viewer**: Modal lightbox viewer with keyboard navigation (`Esc` to close, `←` / `→` arrow keys to browse), direct download, favorite toggling, and metadata inspector.
- **Favorites Management**: Star/unstar photos stored in browser `localStorage` with a dedicated "Favorites" tab filter.
- **Real-Time Search**: Instant client-side search filtering by filename.
- **Polished States**: Comprehensive loading skeletons, upload progress bars, S3 connection notices, confirmation modals for deletion, and toast notifications.

---

## 🏛️ Architecture

```text
┌─────────────────────────────────┐
│     React Frontend (Vite)       │
│     http://localhost:5173       │
└────────────────┬────────────────┘
                 │ HTTP REST API (JSON / FormData)
                 ▼
┌─────────────────────────────────┐
│   Node.js + Express Backend     │
│     http://localhost:5000       │
└────────────────┬────────────────┘
                 │ AWS SDK for JavaScript v3
                 │ (@aws-sdk/client-s3 & presigner)
                 ▼
┌─────────────────────────────────┐
│         Amazon S3 Bucket        │
│    (Private Object Storage)     │
│            photos/              │
└─────────────────────────────────┘
```

> **Security Note:** The browser communicates strictly with the Express backend API. No AWS access keys or secret credentials are ever exposed to the client.

---

## 📁 Project Structure

```text
cloudpix/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx         # Logo, search bar, tabs, upload button
│   │   │   ├── MasonryGallery.jsx # Pinterest masonry column layout
│   │   │   ├── PhotoCard.jsx      # Aspect-ratio card with hover controls
│   │   │   ├── PhotoViewer.jsx    # Lightbox viewer modal & keyboard controls
│   │   │   ├── UploadModal.jsx    # Drag-and-drop uploader with progress
│   │   │   ├── ShareModal.jsx     # Pre-signed temporary share link generator
│   │   │   ├── ConfirmModal.jsx   # Deletion confirmation modal
│   │   │   ├── StatusModal.jsx    # Cloud & S3 connectivity details
│   │   │   ├── EmptyState.jsx     # Empty gallery / search / favorites states
│   │   │   └── Toast.jsx          # Toast feedback notifications
│   │   ├── pages/
│   │   │   └── Gallery.jsx        # Main gallery page & state coordinator
│   │   ├── services/
│   │   │   └── api.js             # Frontend API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css              # Custom design system & light UI styles
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── photoController.js # API request controllers
│   │   ├── middleware/
│   │   │   └── upload.js          # Multer memory storage & validation
│   │   ├── routes/
│   │   │   └── photoRoutes.js     # REST API route definitions
│   │   ├── services/
│   │   │   └── s3Service.js       # AWS S3 client & pre-signed URL service
│   │   └── server.js              # Express app entrypoint & CORS setup
│   ├── package.json
│   ├── .env.example
│   └── .env                       # Local AWS credentials (git-ignored)
│
├── .gitignore
├── .env.example
├── package.json                   # Root orchestrator scripts
└── README.md
```

---

## 🚀 Local Setup & Installation

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **AWS Account** with an Amazon S3 Bucket created

---

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd CloudPix
```

---

### Step 2: Install Backend Dependencies

```bash
cd backend
npm install
```

---

### Step 3: Install Frontend Dependencies

```bash
cd ../frontend
npm install
cd ..
```

---

### Step 4: Configure Backend Environment Variables

1. In the `backend/` folder, copy `.env.example` to `.env`:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Fill in your AWS credentials and S3 bucket details in `backend/.env`:

   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_aws_access_key_id
   AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
   S3_BUCKET_NAME=your-s3-bucket-name
   PORT=5000
   FRONTEND_URL=http://localhost:5173
   ```

---

### Step 5: Configure S3 Bucket Settings

1. **Bucket Privacy**: Keep your S3 bucket **Private** (block all public access enabled). CloudPix uses pre-signed URLs, so public read access is **not** required.
2. **Bucket CORS Configuration**:
   In the AWS Management Console, navigate to **S3** → your bucket → **Permissions** tab → **Cross-origin resource sharing (CORS)** and add:

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["http://localhost:5173", "http://127.0.0.1:5173"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

---

### Step 6: Start the Application

You can start backend and frontend using root scripts or in separate terminal windows:

#### Terminal 1 — Start Backend

```bash
npm run dev:backend
# Or: cd backend && npm run dev
```

The backend server runs on `http://localhost:5000`.

#### Terminal 2 — Start Frontend

```bash
npm run dev:frontend
# Or: cd frontend && npm run dev
```

The frontend application runs on `http://localhost:5173`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Check backend uptime and S3 configuration status |
| `GET` | `/api/photos` | List all photos in S3 under `photos/` with pre-signed access URLs |
| `POST` | `/api/photos` | Upload one or multiple photos to S3 (`photos` field, multipart/form-data) |
| `GET` | `/api/photos/:key` | Get details and a fresh pre-signed URL for a photo |
| `DELETE`| `/api/photos/:key` | Permanently delete a photo object from S3 |
| `POST` | `/api/photos/:key/share`| Generate temporary pre-signed share link (`{ expiresIn: 600 }`) |

---

## ☁️ Future AWS EC2 Deployment Readiness

The codebase is prepared for future EC2 deployment without major architectural rewrites:

1. **No Permanent Local Filesystem Storage**: The backend uses Multer's in-memory storage buffer. Images are streamed directly to S3 and never saved on EC2's disk.
2. **IAM Role Support**:
   When deployed on an EC2 instance:
   - Attach an **IAM Instance Profile** with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject`, and `s3:ListBucket` permissions to the EC2 instance.
   - Omit `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in production `.env`. The AWS SDK v3 automatically assumes the EC2 IAM Role credentials.
3. **Configurable API Endpoint**:
   The frontend uses `import.meta.env.VITE_API_URL` (defined in `frontend/.env`). When deployed, update this to your EC2 domain or Elastic IP.
4. **CORS Configuration**:
   Update `FRONTEND_URL` in `backend/.env` to your production domain or IP.
