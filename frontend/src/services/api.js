const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Helper to handle fetch responses and extract helpful error messages
 */
async function handleResponse(response) {
  if (!response.ok) {
    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || 'Network response was not ok' };
    }
    const error = new Error(errorData.message || errorData.error || 'API Request failed');
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  return response.json();
}

/**
 * Fetch all photos from backend / S3
 */
export async function getPhotos() {
  const response = await fetch(`${API_BASE}/api/photos`);
  return handleResponse(response);
}

/**
 * Fetch single photo details by key
 */
export async function getPhotoByKey(key) {
  const encodedKey = encodeURIComponent(key);
  const response = await fetch(`${API_BASE}/api/photos/${encodedKey}`);
  return handleResponse(response);
}

/**
 * Upload multiple or single photos with XMLHttpRequest for upload progress tracking
 */
export function uploadPhotos(files, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append('photos', file);
    });

    xhr.open('POST', `${API_BASE}/api/photos`);

    if (onProgress && xhr.upload) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });
    }

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(data);
        } else {
          const err = new Error(data.message || data.error || 'Upload failed');
          err.status = xhr.status;
          err.data = data;
          reject(err);
        }
      } catch (e) {
        reject(new Error(`Failed to parse response: ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during photo upload. Is the backend running?'));
    };

    xhr.send(formData);
  });
}

/**
 * Delete a photo by key
 */
export async function deletePhoto(key) {
  const encodedKey = encodeURIComponent(key);
  const response = await fetch(`${API_BASE}/api/photos/${encodedKey}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
}

/**
 * Generate a pre-signed share URL with custom expiration in seconds
 */
export async function sharePhoto(key, expiresIn = 600) {
  const encodedKey = encodeURIComponent(key);
  const response = await fetch(`${API_BASE}/api/photos/${encodedKey}/share`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ expiresIn }),
  });
  return handleResponse(response);
}

/**
 * Check backend and S3 connectivity
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE}/api/health`);
    return await response.json();
  } catch (err) {
    return {
      status: 'offline',
      message: 'Cannot reach backend server. Please verify it is running on port 5000.',
    };
  }
}
