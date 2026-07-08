'use strict';

const { desktopCapturer, screen } = require('electron');

// Capture the primary display as a downscaled JPEG (base64, no data: prefix).
// Uses Electron's built-in desktopCapturer so there are NO native binaries to
// ship. On macOS the app needs Screen Recording permission (handled in main).
async function captureScreenBase64(maxWidth) {
  const primary = screen.getPrimaryDisplay();
  const { width, height } = primary.size;
  const scale = primary.scaleFactor || 1;

  // Ask for a thumbnail already downscaled to our target width to keep payloads
  // small (cheaper API calls, more privacy — text is barely legible at 1280px).
  const targetWidth = Math.min(maxWidth || 1280, width * scale);
  const targetHeight = Math.round((height / width) * targetWidth);

  const sources = await desktopCapturer.getSources({
    types: ['screen'],
    thumbnailSize: { width: targetWidth, height: targetHeight }
  });

  if (!sources.length) throw new Error('No screen sources available.');

  // Pick the primary screen source when there are multiple displays.
  const primaryId = String(primary.id);
  const source =
    sources.find((s) => s.display_id === primaryId) || sources[0];

  const image = source.thumbnail;
  if (image.isEmpty()) throw new Error('Captured an empty frame (permission?).');

  return image.toJPEG(70).toString('base64');
}

module.exports = { captureScreenBase64 };
