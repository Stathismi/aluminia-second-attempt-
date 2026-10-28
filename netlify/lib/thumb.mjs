// Small "thumbnail" versions of project photos for the carousel (pure JS, no native deps).
import jpeg from "jpeg-js";

export const THUMB_MAX = 720;      // longest side in px
export const THUMB_QUALITY = 72;   // JPEG quality

// Downscale RGBA pixels with box averaging (good quality for big reductions).
function downscale(src, sw, sh, dw, dh) {
  const out = Buffer.alloc(dw * dh * 4);
  const xr = sw / dw, yr = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0 = Math.floor(y * yr), y1 = Math.max(y0 + 1, Math.floor((y + 1) * yr));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.floor(x * xr), x1 = Math.max(x0 + 1, Math.floor((x + 1) * xr));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = y0; yy < y1 && yy < sh; yy++) {
        let i = (yy * sw + x0) * 4;
        for (let xx = x0; xx < x1 && xx < sw; xx++, i += 4) { r += src[i]; g += src[i + 1]; b += src[i + 2]; n++; }
      }
      const o = (y * dw + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
    }
  }
  return out;
}

// Returns a JPEG Buffer no larger than THUMB_MAX on its longest side, or null if the input is not a JPEG.
export function makeThumb(bytes) {
  const buf = Buffer.from(bytes);
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null; // not a JPEG
  const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true, maxMemoryUsageInMB: 256 });
  const scale = Math.min(1, THUMB_MAX / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const data = scale < 1 ? downscale(img.data, img.width, img.height, w, h) : img.data;
  return jpeg.encode({ data, width: w, height: h }, THUMB_QUALITY).data;
}
