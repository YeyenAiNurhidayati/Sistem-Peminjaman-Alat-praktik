import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { put, del } from '@vercel/blob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4MB

/**
 * Validates magic bytes to prevent file extension spoofing attacks
 */
export function validateImageMagicBytes(buffer) {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: 'Ukuran file tidak valid atau file kosong' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { valid: true, mime: 'image/jpeg', ext: '.jpg' };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A &&
    buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return { valid: true, mime: 'image/png', ext: '.png' };
  }

  // WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { valid: true, mime: 'image/webp', ext: '.webp' };
  }

  return { valid: false, error: 'Format file tidak didukung! Hanya gambar JPG, PNG, dan WebP yang diizinkan.' };
}

/**
 * Uploads an image file to either Vercel Blob (production) or local filesystem (development)
 * @param {Buffer} buffer - File buffer
 * @param {string} declaredMime - MIME type declared by client
 * @param {string} folder - Destination subfolder ('profil', 'barang', 'bukti_kembali')
 * @returns {Promise<string>} Public URL or web path of stored file
 */
export async function uploadImage(buffer, declaredMime, folder = 'profil') {
  if (!buffer) {
    throw new Error('Buffer file tidak boleh kosong');
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error('Ukuran file melebihi batas maksimal 4MB');
  }

  // Validate magic bytes strictly
  const magicResult = validateImageMagicBytes(buffer);
  if (!magicResult.valid) {
    throw new Error(magicResult.error);
  }

  // Generate cryptographically random unique filename (128-bit random bytes for private evidence)
  const random128 = crypto.randomBytes(16).toString('hex');
  const randomName = `${Date.now()}_${random128}${magicResult.ext}`;
  const isPrivate = folder === 'bukti_kembali';
  const accessMode = isPrivate ? 'private' : 'public';

  // Production Environment: Strictly require Vercel Blob storage, NEVER write to ephemeral local disk
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error('Penyimpanan cloud Vercel Blob belum dikonfigurasi (BLOB_READ_WRITE_TOKEN tidak ditemukan) pada lingkungan production.');
    }

    try {
      const blob = await put(`${folder}/${randomName}`, buffer, {
        access: accessMode,
        contentType: magicResult.mime
      });
      // Untuk bukti_kembali, simpan nama berkas agar selalu diakses melalui proxy autentikasi /peminjaman/bukti/:filename
      if (isPrivate) {
        return randomName;
      }
      return blob.url;
    } catch (blobError) {
      console.error('Vercel Blob upload failed:', blobError);
      throw new Error(`Gagal mengunggah foto ke storage cloud: ${blobError.message}`);
    }
  }

  // Non-Production (Development/Testing): If token is explicitly provided, use Blob; otherwise fallback to local disk
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const blob = await put(`${folder}/${randomName}`, buffer, {
        access: accessMode,
        contentType: magicResult.mime
      });
      if (isPrivate) {
        return randomName;
      }
      return blob.url;
    } catch (blobError) {
      console.warn('Vercel Blob in non-production failed, falling back to local storage:', blobError.message);
    }
  }

  // Local filesystem adapter: strictly active only in non-production environments
  const uploadDir = path.join(rootDir, 'public', 'assets', 'uploads', folder);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const filePath = path.join(uploadDir, randomName);
  fs.writeFileSync(filePath, buffer);

  // Return web-accessible path
  return `/assets/uploads/${folder}/${randomName}`;
}

/**
 * Deletes an old image file if applicable
 */
export async function deleteImage(fileUrlOrPath, folder = 'profil') {
  if (!fileUrlOrPath || fileUrlOrPath === 'default.png' || fileUrlOrPath.includes('ui-avatars.com')) {
    return;
  }

  try {
    // If it's a Vercel Blob URL
    if (fileUrlOrPath.startsWith('https://') && fileUrlOrPath.includes('.public.blob.vercel-storage.com')) {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        await del(fileUrlOrPath);
      }
      return;
    }

    // Local file path
    const filename = path.basename(fileUrlOrPath);
    const localPath = path.join(rootDir, 'public', 'assets', 'uploads', folder, filename);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  } catch (err) {
    console.error('Delete image error (non-fatal):', err.message);
  }
}

export default {
  validateImageMagicBytes,
  uploadImage,
  deleteImage,
  MAX_FILE_SIZE
};
