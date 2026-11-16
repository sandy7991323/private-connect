/**
 * Formats a byte quantity into a human-readable string.
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B';
  if (bytes < 0 || isNaN(bytes)) return '0 B';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const safeI = Math.min(i, sizes.length - 1);

  return `${parseFloat((bytes / Math.pow(k, safeI)).toFixed(dm))} ${sizes[safeI]}`;
}

/**
 * Formats transfer speed (bytes/sec) into human-readable rate.
 */
export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0 KB/s';
  return `${formatBytes(bytesPerSec, 1)}/s`;
}

/**
 * Sanitizes a filename to prevent path traversal and unsafe character injection.
 */
export function sanitizeFileName(rawName: string): string {
  if (!rawName || typeof rawName !== 'string') {
    return `unnamed-file-${Date.now()}`;
  }

  // Remove leading/trailing whitespace
  let clean = rawName.trim();

  // Strip path traversal attempts: slashes and dots sequences
  clean = clean.replace(/^.*[\\\/]/, ''); // remove any directories
  clean = clean.replace(/(\.\.[\/\\])+/g, ''); // strip ..

  // Replace invalid filesystem characters: < > : " / \ | ? * and control chars
  clean = clean.replace(/[<>:"/\\|?*\x00-\x1F]/g, '_');

  // Prevent dot-only files (. or ..)
  if (clean.length === 0 || /^(\.)+$/.test(clean)) {
    clean = `unnamed-file-${Date.now()}`;
  }

  // Limit filename length to 120 characters
  if (clean.length > 120) {
    const extIndex = clean.lastIndexOf('.');
    if (extIndex > 0) {
      const ext = clean.slice(extIndex);
      clean = clean.slice(0, 120 - ext.length) + ext;
    } else {
      clean = clean.slice(0, 120);
    }
  }

  return clean;
}

/**
 * Determines preview type based on mime type or extension.
 */
export function getFileCategory(mimeType: string, filename: string): 'image' | 'video' | 'audio' | 'pdf' | 'text' | 'archive' | 'code' | 'generic' {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = (filename || '').toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/.test(lowerName)) {
    return 'image';
  }
  if (lowerMime.startsWith('video/') || /\.(mp4|webm|ogg|mov|mkv)$/.test(lowerName)) {
    return 'video';
  }
  if (lowerMime.startsWith('audio/') || /\.(mp3|wav|ogg|aac|m4a|flac)$/.test(lowerName)) {
    return 'audio';
  }
  if (lowerMime === 'application/pdf' || lowerName.endsWith('.pdf')) {
    return 'pdf';
  }
  if (
    lowerMime.startsWith('text/') ||
    /\.(txt|md|csv|json|xml|yaml|yml|log|rtf)$/.test(lowerName)
  ) {
    return 'text';
  }
  if (/\.(zip|tar|gz|7z|rar|bz2)$/.test(lowerName)) {
    return 'archive';
  }
  if (/\.(js|ts|jsx|tsx|html|css|py|rs|go|java|c|cpp|h|sh|sql)$/.test(lowerName)) {
    return 'code';
  }

  return 'generic';
}

/**
 * Initiates browser download of a generated Blob URL.
 */
export function triggerFileDownload(blobUrl: string, rawFilename: string): void {
  const safeName = sanitizeFileName(rawFilename);
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = safeName;
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
