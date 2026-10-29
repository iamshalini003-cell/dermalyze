export interface PreparedImage {
  blob: Blob;
  base64: string;
  previewUrl: string;
}

const MAX_SIDE = 1024;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Keep the request comfortably under the API size limit.
const MAX_BASE64_CHARS = 900_000;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image. Try a JPG or PNG photo.'));
    };
    img.src = url;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not process the photo.'))),
      'image/jpeg',
      quality
    );
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(new Error('Could not process the photo.'));
    reader.readAsDataURL(blob);
  });
}

/** Validate, shrink to at most 1024px, and convert to JPEG. */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('That photo is larger than 10 MB. Please choose a smaller one.');
  }

  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Your browser cannot process images.');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let quality = 0.85;
  let blob = await canvasToBlob(canvas, quality);
  let base64 = await blobToBase64(blob);
  while (base64.length > MAX_BASE64_CHARS && quality > 0.4) {
    quality -= 0.15;
    blob = await canvasToBlob(canvas, quality);
    base64 = await blobToBase64(blob);
  }

  return { blob, base64, previewUrl: URL.createObjectURL(blob) };
}
