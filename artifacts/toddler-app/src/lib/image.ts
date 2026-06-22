// Helpers for the child profile photo upload. We only accept common web image
// formats and always downscale to a small square data URL before storing, so a
// large camera photo can't blow the localStorage quota and the avatar stays
// crisp and lightweight wherever it's shown.

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const ACCEPTED_IMAGE_EXTENSIONS = ".jpg,.jpeg,.png,.webp";

const MAX_DIMENSION = 256; // square output edge in px

export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}

// Read a user-selected file, validate its type, then center-crop to a square and
// downscale to MAX_DIMENSION. Returns a JPEG (or PNG, to preserve transparency)
// data URL suitable for storing on the profile and rendering with object-cover.
export async function fileToAvatarDataUrl(file: File): Promise<string> {
  if (!isAcceptedImageType(file.type)) {
    throw new Error("Please choose a JPG, PNG or WEBP image.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });

  const img = await loadImage(dataUrl);
  const side = Math.min(img.width, img.height);
  const sx = (img.width - side) / 2;
  const sy = (img.height - side) / 2;

  const canvas = document.createElement("canvas");
  canvas.width = MAX_DIMENSION;
  canvas.height = MAX_DIMENSION;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process that image.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, side, side, 0, 0, MAX_DIMENSION, MAX_DIMENSION);

  // Keep PNG transparency; everything else becomes a compact JPEG.
  return file.type === "image/png"
    ? canvas.toDataURL("image/png")
    : canvas.toDataURL("image/jpeg", 0.85);
}
