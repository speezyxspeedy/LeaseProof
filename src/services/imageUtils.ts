/**
 * Camera capture & client-side image compression
 * Stores compressed Base64 data URLs inside IndexedDB for instant preview & zero upload.
 */

export async function compressImageFile(file: File, maxDimension = 1400, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image file into canvas'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Generate realistic SVG-based property / room / damage evidence photos for demo workspace
export function generateSyntheticPhoto(
  title: string,
  category: string,
  bgColor = '#e2e8f0',
  textColor = '#334155'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 800, 600);

  // Subtle grid / architectural blueprint texture
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 800; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 600);
    ctx.stroke();
  }
  for (let y = 0; y < 600; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(800, y);
    ctx.stroke();
  }

  // Room / Feature illustration box
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.roundRect(80, 80, 640, 440, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Category Badge
  ctx.fillStyle = '#0f172a';
  ctx.roundRect(110, 110, 160, 36, 6);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(category.toUpperCase(), 125, 133);

  // Title
  ctx.fillStyle = textColor;
  ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, 110, 200);

  // Subtitle / Inspection metadata watermark
  ctx.fillStyle = '#64748b';
  ctx.font = '15px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('LEASEPROOF DIGITAL EVIDENCE VERIFICATION', 110, 235);
  ctx.fillText(`Timestamp: ${new Date().toISOString().replace('T', ' ').substring(0, 19)} UTC`, 110, 260);
  ctx.fillText('Hash: SHA-256 Verified Local Blob Reference', 110, 285);

  // Center graphic marker
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(400, 390, 60, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(370, 390);
  ctx.lineTo(430, 390);
  ctx.moveTo(400, 360);
  ctx.lineTo(400, 420);
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.85);
}
