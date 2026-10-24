export const OPEN_SUBMIT_EVENT = "open-submit-modal";

export const openSubmit = () => window.dispatchEvent(new Event(OPEN_SUBMIT_EVENT));

/** Downscales to max 1200px wide and re-encodes as WebP so uploads stay small (<~150 KB typically). */
export async function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/webp", quality),
  );
}
