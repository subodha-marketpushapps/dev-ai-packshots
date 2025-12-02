/**
 * Canvas Export Configuration
 * 
 * Settings for controlling how images are exported from the Fabric.js canvas.
 * Adjust these values to balance file size vs. image quality.
 */

/**
 * Canvas image export quality setting (0.0 to 1.0)
 * 
 * Recommended values:
 * - 0.95 (95%) - Excellent quality, good compression (~4-5MB for 4K images) ✅ CURRENT
 * - 0.90 (90%) - Very good quality, better compression (~2-3MB)
 * - 0.85 (85%) - Good quality, maximum compression (~1.5-2MB)
 * - 0.98 (98%) - Near-perfect quality, larger files (~6-7MB)
 * 
 * Note: Only applies when CANVAS_EXPORT_FORMAT is "jpeg" or "webp"
 */
export const CANVAS_EXPORT_QUALITY = 0.95;

/**
 * Canvas image export format
 * 
 * Options:
 * - "jpeg" - Best compression, no transparency support (recommended for product photos) ✅ CURRENT
 * - "png"  - Lossless, supports transparency (larger file sizes ~6x)
 * - "webp" - Modern format, supports transparency + compression (best of both worlds, 95%+ browser support)
 */
export const CANVAS_EXPORT_FORMAT = "jpeg" as const;

/**
 * Derived MIME type from export format
 */
export const CANVAS_EXPORT_MIME_TYPE = `image/${CANVAS_EXPORT_FORMAT}` as const;

/**
 * Derived file extension from export format
 */
export const CANVAS_EXPORT_FILE_EXTENSION = CANVAS_EXPORT_FORMAT === "jpeg" ? "jpg" : CANVAS_EXPORT_FORMAT;
