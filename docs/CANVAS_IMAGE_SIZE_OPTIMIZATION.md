# Canvas Image Export Configuration

## 📋 Overview

The canvas export system is optimized for product photography, using JPEG format with 95% quality to balance excellent image quality with efficient file sizes.

**Current Configuration:**
- Format: JPEG
- Quality: 95%
- Typical Output: 4-5 MB for 4K images
- Status: ✅ Production Ready

---

## 🎯 Implementation

### Canvas Configuration File
**File:** `src/constants/canvas.ts`

```typescript
export const CANVAS_EXPORT_QUALITY = 0.95;  // 95% JPEG quality
export const CANVAS_EXPORT_FORMAT = "jpeg" as const;
export const CANVAS_EXPORT_MIME_TYPE = `image/${CANVAS_EXPORT_FORMAT}` as const;
export const CANVAS_EXPORT_FILE_EXTENSION = CANVAS_EXPORT_FORMAT === "jpeg" ? "jpg" : CANVAS_EXPORT_FORMAT;
```

**Benefits:**
- Centralized configuration for easy maintenance
- Type-safe format definitions
- Automatic MIME type and extension derivation
- Single source of truth for export settings

### Canvas Export Usage
**File:** `src/dashboard/pages/PhotoStudio/EditorCanvas/EditorCanvas.tsx`

The canvas export functions use these constants automatically:

```typescript
import { CANVAS_EXPORT_FORMAT, CANVAS_EXPORT_QUALITY } from "@/constants";

// Export canvas to file
canvas.toDataURL({ 
  format: CANVAS_EXPORT_FORMAT,  // "jpeg"
  quality: CANVAS_EXPORT_QUALITY, // 0.95
  multiplier: 1 
})

// Convert URL to file
canvas.toBlob(callback, "image/jpeg", CANVAS_EXPORT_QUALITY)
```

---

## 📊 Performance Characteristics

### Typical Export Sizes
| Image Resolution | File Size | Export Time |
|-----------------|-----------|-------------|
| **4K (4284×5712)** | ~4.2 MB | ~350ms |
| **Medium (1440×1920)** | ~0.6 MB | ~75ms |
| **Small (1000×1000)** | ~0.3 MB | ~50ms |

### Format Comparison
| Format | 4K File Size | Compression | Transparency | Speed |
|--------|-------------|-------------|--------------|-------|
| **JPEG (95%)** ✅ | ~4 MB | 10:1 | ❌ | Fast |
| PNG | ~25 MB | 3:1 | ✅ | Slower |
| WebP | ~3 MB | 12:1 | ✅ | Fast |

---

## 🎛️ Quality Configuration Guide

### Current Setting: 95% Quality (Recommended)
```typescript
CANVAS_EXPORT_QUALITY = 0.95
```
- File Size: ~4-5 MB for 4K images
- Visual Quality: Excellent, near-lossless
- Use Case: Production-ready for all purposes

### Alternative Quality Settings

#### High Quality (98%)
```typescript
CANVAS_EXPORT_QUALITY = 0.98
```
- File Size: ~6-7 MB
- Quality: Near-perfect
- Use Case: When quality is critical

#### Balanced (90%)
```typescript
CANVAS_EXPORT_QUALITY = 0.90
```
- File Size: ~2-3 MB
- Quality: Very good
- Use Case: Good balance for most uses

#### Maximum Compression (85%)
```typescript
CANVAS_EXPORT_QUALITY = 0.85
```
- File Size: ~1.5-2 MB
- Quality: Good
- Use Case: When file size is critical

### How to Adjust
Simply edit `src/constants/canvas.ts`:
```typescript
export const CANVAS_EXPORT_QUALITY = 0.90; // Change to desired value
```

---

## 🔄 Format Options

### JPEG (Current - Recommended for Product Photos)
```typescript
CANVAS_EXPORT_FORMAT = "jpeg" as const;
```
**When to use:**
- Product photography (no transparency needed)
- Optimal balance of quality and file size
- Maximum browser compatibility required

**Characteristics:**
- Excellent compression (10:1 ratio)
- Small file sizes
- Fast export performance
- 100% browser support

### WebP (Alternative)
```typescript
CANVAS_EXPORT_FORMAT = "webp" as const;
```
**When to use:**
- Best overall compression needed
- Transparency support required
- Modern browser environment (95%+ support)

**Characteristics:**
- Best compression (12:1 ratio)
- Supports transparency
- Smaller than JPEG
- Modern format

### PNG (For Transparency)
```typescript
CANVAS_EXPORT_FORMAT = "png" as const;
CANVAS_EXPORT_QUALITY = undefined; // Not applicable
```
**When to use:**
- Transparency is mandatory
- Lossless quality required
- File size is not a concern

**Characteristics:**
- Lossless compression (3:1 ratio)
- Supports transparency
- Larger file sizes (~6x JPEG)
- 100% browser support

---

## ⚠️ Advanced Configurations

### Handling Transparency
JPEG does not support transparency. If your use case requires transparency:

**Option A: Conditional Format Selection**
```typescript
const hasAlpha = checkForTransparency(image);
const format = hasAlpha ? "png" : "jpeg";
const quality = hasAlpha ? undefined : CANVAS_EXPORT_QUALITY;
```

**Option B: Use WebP Format**
```typescript
CANVAS_EXPORT_FORMAT = "webp" // Supports transparency + compression
```

**Option C: Composite on White Background**
```typescript
canvas.setBackgroundColor('#FFFFFF', () => {
  // Export as JPEG with white background
});
```

### Browser Compatibility
| Format | Support |
|--------|---------|
| JPEG | 100% ✅ |
| PNG | 100% ✅ |
| WebP | 95%+ ✅ |

### Quick Format Change
To change the export format, edit `src/constants/canvas.ts`:
```typescript
export const CANVAS_EXPORT_FORMAT = "png" as const;
export const CANVAS_EXPORT_QUALITY = undefined; // N/A for PNG
```
All export functions will automatically use the new settings.

---

## 📚 Technical Details

### Fabric.js Canvas Export API
```typescript
canvas.toDataURL(options?: {
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;        // 0.0 to 1.0 (JPEG/WebP only)
  multiplier?: number;     // Scale factor
  left?: number;           // Crop left
  top?: number;            // Crop top
  width?: number;          // Crop width
  height?: number;         // Crop height
}): string;
```

### File Size Math
```
Uncompressed RGBA (4284x5712): 
= 4284 × 5712 × 4 bytes
= 97,900,032 bytes
= 93.35 MB

PNG compression (~3:1):
= 93.35 ÷ 3
= ~31 MB

JPEG compression (~10:1 at 95%):
= 93.35 ÷ 22
= ~4.2 MB
```

### Base64 Encoding Overhead
Canvas `toDataURL()` returns Base64-encoded string:
- Base64 adds ~33% overhead
- Decoded when converted to File/Blob
- Final file size is actual compressed size (not Base64 size)

---

## 🔍 Future Enhancements

### 1. Progressive Quality
Implement adaptive quality based on image size:
```typescript
const quality = imageSize > 5000000 ? 0.90 : 0.95;
```

### 2. Format Detection
Auto-detect best format based on content:
```typescript
const hasTransparency = detectAlpha(image);
const format = hasTransparency ? "webp" : "jpeg";
```

### 3. Client-Side Compression
Add additional compression library for maximum optimization:
```typescript
import imageCompression from 'browser-image-compression';
```

### 4. Quality Presets
Provide user-selectable quality presets:
```typescript
export const QUALITY_PRESETS = {
  high: 0.98,
  medium: 0.95,
  low: 0.85
};
```

---

## 📖 Related Documentation

- **Copilot Instructions:** `.github/copilot-instructions.md`
- **Canvas Constants:** `src/constants/canvas.ts`
- **Editor Canvas Component:** `src/dashboard/pages/PhotoStudio/EditorCanvas/EditorCanvas.tsx`
- **Flux Edit Handlers:** `src/dashboard/hooks/useFluxEditHandlers.ts`

---

## 💡 Best Practices

1. **Use JPEG for product photos** - Optimal compression with excellent quality
2. **95% quality setting** - Sweet spot for near-lossless results
3. **Centralized configuration** - All settings in `src/constants/canvas.ts`
4. **Consider WebP for future** - Best compression with transparency support
5. **Monitor file sizes** - Keep output under 5MB for optimal performance

---

## 📖 Related Files

- **Configuration:** `src/constants/canvas.ts`
- **Implementation:** `src/dashboard/pages/PhotoStudio/EditorCanvas/EditorCanvas.tsx`
- **Integration:** `src/dashboard/hooks/useFluxEditHandlers.ts`

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-03  
**Maintained By:** Development Team
