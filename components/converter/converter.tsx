"use client";
import { ArrowRightToLine } from "lucide-react";
import { Button } from "../ui/button";
import {
  initializeImageMagick,
  ImageMagick,
  MagickFormat,
  MagickColor,
  ColorSpace,
  Percentage,
  IMagickGeometry,
  MagickGeometry,
} from "@imagemagick/magick-wasm";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Slider } from "../ui/slider";
// @ts-ignore - import wasm asset URL via bundler
// Importing the wasm via bundler can be unreliable across setups; we'll fetch from CDN pinned to package version

let magickInitPromise: Promise<void> | null = null;

export const ensureMagickInitialized = async () => {
  if (!magickInitPromise) {
    magickInitPromise = (async () => {
      // Always use the wasm that matches the installed JS glue (prevents BigInt mismatches)
      const resp = await fetch(
        "https://unpkg.com/@imagemagick/magick-wasm@0.0.35/dist/magick.wasm"
      );
      const wasmBuffer = await resp.arrayBuffer();
      await initializeImageMagick(wasmBuffer);
    })();
  }
  return magickInitPromise;
};

export const Converter = ({
  files = [],
  addBlob,
  format,
  quality,
  width,
  height,
  filter,
  brightness,
  contrast,
  rotation,
  flip,
  flop,
  blur = 0,
  sharpen = 0,
  noise = 0,
  vignette = 0,
  pixelate = 0,
  saturation = 0,
  gamma = 1.0,
}: {
  files: File[];
  addBlob: (blob: Blob, fileName:string) => void;
  format: MagickFormat;
  quality: number;
  width?: number;
  height?: number;
  filter: string;
  brightness: number;
  contrast: number;
  rotation: number;
  flip: boolean;
  flop: boolean;
  blur?: number;
  sharpen?: number;
  noise?: number;
  vignette?: number;
  pixelate?: number;
  saturation?: number;
  gamma?: number;
}) => {

  const mimeFromFormat = (fmt: MagickFormat): string => {
    switch (fmt) {
      case MagickFormat.Jpg:
      case MagickFormat.Jpeg:
        return "image/jpeg";
      case MagickFormat.Png:
        return "image/png";
      case MagickFormat.WebP:
        return "image/webp";
      case MagickFormat.Jxl:
        return "image/jxl";
      case MagickFormat.Bmp:
        return "image/bmp";
      case MagickFormat.Tiff:
        return "image/tiff";
      case MagickFormat.Ico:
        return "image/x-icon";
      default:
        return `image/${String(fmt).toLowerCase()}`;
    }
  };

  const convert = async () => {
    await ensureMagickInitialized();
    // Log the final conversion settings
    console.log("Final conversion settings:", {
      quality,
      width,
      height,
      filter,
      brightness,
      contrast,
      rotation,
      flip,
      flop,
      blur,
      sharpen,
      noise,
      vignette,
      pixelate,
      saturation,
      gamma,
    });

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      await new Promise<void>((resolve) => {
        ImageMagick.read(new Uint8Array(arrayBuffer), (image) => {
          image.quality = quality;

          // Resize if both dimensions provided
          if (typeof width === 'number' && typeof height === 'number' && width > 0 && height > 0) {
            image.resize(width, height);
          }

          // Basic filters / effects
          switch (filter) {
            case "grayscale":
              image.colorSpace = ColorSpace.Gray;
              break;
            case "sepia":
              image.sepiaTone(new Percentage(80));
              break;
            case "invert":
              // @ts-ignore
              image.negate();
              break;
            case "vintage":
              image.sepiaTone(new Percentage(45));
              try {
                // @ts-ignore - use modulate to lower saturation slightly
                image.modulate(new Percentage(100), new Percentage(85), new Percentage(100));
              } catch {}
              break;
            default:
              break;
          }

          // Color adjustments
          image.brightnessContrast(new Percentage(brightness), new Percentage(contrast));
          if (typeof saturation === 'number' && saturation !== 0) {
            // Only change saturation, keep brightness/hue as-is (100)
            try {
              image.modulate(new Percentage(100), new Percentage(Math.max(0, 100 + saturation)), new Percentage(100));
            } catch {}
          }
          if (typeof gamma === 'number' && gamma > 0 && gamma !== 1) {
            try {
              // @ts-ignore
              image.gammaCorrect(gamma);
            } catch {
              try {
                // @ts-ignore
                image.gamma(gamma);
              } catch {}
            }
          }

          // Ensure transparent background for rotations that introduce empty corners
          if (rotation && rotation % 360 !== 0) {
            image.backgroundColor = new MagickColor(0, 0, 0, 0);
            image.rotate(rotation);
          }

          // Flips
          if (flip) {
            image.flip(); // vertical
          }
          if (flop) {
            image.flop(); // horizontal
          }

          // Blur (Gaussian)
          if (typeof blur === 'number' && blur > 0) {
            try {
              // radius 0 lets ImageMagick choose, sigma from slider
              // @ts-ignore - magick-wasm supports (radius: number, sigma: number)
              image.blur(0, blur);
            } catch (e) {
              // Fallback: try single-arg sigma signature
              // @ts-ignore
              image.blur(blur);
            }
          }

          // Sharpen
          if (typeof sharpen === 'number' && sharpen > 0) {
            const sigma = Math.max(0.2, Math.min(5, sharpen / 20));
            try {
              // @ts-ignore - sharpen(radius, sigma)
              image.sharpen(0, sigma);
            } catch {}
          }

          // Noise reduction (median filter)
          if (typeof noise === 'number' && noise > 0) {
            const radius = noise < 35 ? 1 : noise < 70 ? 2 : 3;
            try {
              // @ts-ignore - medianFilter(radius)
              image.medianFilter(radius);
            } catch {
              // fallback: small gaussian blur if median not available
              try {
                // @ts-ignore
                image.blur(0, 0.5);
              } catch {}
            }
          }

          // Pixelate (downscale with point sampling, then upscale)
          if (typeof pixelate === 'number' && pixelate > 0) {
            try {
              // Store original size
              // @ts-ignore
              const ow = image.width;
              // @ts-ignore
              const oh = image.height;
              const scale = Math.max(2, Math.min(50, Math.floor(pixelate)));
              const dw = Math.max(1, Math.floor(ow / scale));
              const dh = Math.max(1, Math.floor(oh / scale));
              try {
                // Prefer point/nearest filter if available
                // @ts-ignore
                const FilterType = (ImageMagick as any).FilterType || undefined;
                if (FilterType) {
                  // @ts-ignore
                  image.filterType = FilterType.Point;
                }
              } catch {}
              // @ts-ignore - use scale if available to avoid smoothing
              if (typeof (image as any).scale === 'function') {
                // @ts-ignore
                image.scale(dw, dh);
                // @ts-ignore
                image.scale(ow, oh);
              } else {
                image.resize(dw, dh);
                image.resize(ow, oh);
              }
            } catch {}
          }

          // Vignette (if API available)
          if (typeof vignette === 'number' && vignette > 0) {
            try {
              const sigma = Math.max(0.5, Math.min(10, vignette / 10));
              // @ts-ignore - vignette(radius, sigma)
              image.vignette(1, sigma);
            } catch {
              // Ignore if not supported in this build
            }
          }

          image.write(format, (data) => {
            // Create a new Uint8Array from the data to ensure it's a copy with a standard ArrayBuffer
            const blob = new Blob([new Uint8Array(data)], { type: mimeFromFormat(format) });
            addBlob(blob, file.name.split(".").slice(0, -1).join("."));
            resolve();
          });
        });
      });
    }
  };

  return (
    <Button className="my-auto" onClick={convert}>
      <ArrowRightToLine />
    </Button>
  );
};

export type MagickConversionOptions = {
  format: MagickFormat;
  quality: number;
  width?: number;
  height?: number;
  filter?: string;
  brightness?: number;
  contrast?: number;
  hue?: number;
  exposure?: number;
  highlights?: number;
  shadows?: number;
  rotation?: number;
  flip?: boolean;
  flop?: boolean;
  blur?: number;
  sharpen?: number;
  noise?: number;
  vignette?: number;
  pixelate?: number;
  saturation?: number;
  gamma?: number;
  resample?: 'lanczos' | 'bicubic' | 'bilinear' | 'nearest';
  stripMetadata?: boolean;
  autoOrient?: boolean;
  pngCompression?: number;
  webpLossless?: boolean;
  jpegProgressive?: boolean;
  jpegOptimize?: boolean;
  boxWidth?: number;
  boxHeight?: number;
  aspectMode?: 'preserve' | 'force' | 'crop' | 'pad';
  padColor?: { r: number; g: number; b: number; a?: number };
};

export const convertFileWithMagick = async (
  file: Blob,
  opts: MagickConversionOptions
): Promise<Blob> => {
  await ensureMagickInitialized();
  const arrayBuffer = await file.arrayBuffer();
  // Clone bytes into a fresh Uint8Array to avoid backing-store oddities
  const source = new Uint8Array(arrayBuffer);
  const bytes = new Uint8Array(source.length);
  bytes.set(source);
  return await new Promise<Blob>((resolve) => {
    ImageMagick.read(bytes, (image) => {
        // Resampling filter hint where supported
        try {
            const anyImg: any = image as any;
            if (opts.resample) {
                const ft = (ImageMagick as any).FilterType;
                if (ft) {
                    switch (opts.resample) {
                        case "nearest":
                            anyImg.filterType = ft.Point;
                            break;
                        case "bilinear":
                            anyImg.filterType = ft.Triangle;
                            break;
                        case "bicubic":
                            anyImg.filterType = ft.Cubic;
                            break;
                        case "lanczos":
                        default:
                            anyImg.filterType = ft.Lanczos;
                            break;
                    }
                }
            }
        } catch {}
        image.quality = Number(opts.quality) | 0;

        // Auto-orient from EXIF
        if (opts.autoOrient) {
            try {
                // @ts-ignore
                image.autoOrient();
            } catch {}
        }

        // Defer resizing until after rotation

        switch (opts.filter) {
            case "grayscale":
                image.colorSpace = ColorSpace.Gray;
                break;
            case "sepia":
                image.sepiaTone(new Percentage(80));
                break;
            case "invert":
                // @ts-ignore
                image.negate();
                break;
            case "vintage":
                image.sepiaTone(new Percentage(60));
                try {
                    image.modulate(
                        new Percentage(100),
                        new Percentage(85),
                        new Percentage(100)
                    );
                } catch {}
                break;
        }

        image.brightnessContrast(
            new Percentage(opts.brightness ?? 0),
            new Percentage(opts.contrast ?? 0)
        );

        // Hue shift via modulate third parameter is hue in degrees in some builds. If unavailable, skip.
        if (typeof opts.hue !== "undefined" && Number(opts.hue) !== 0) {
            try {
                image.modulate(
                    new Percentage(100),
                    new Percentage(100),
                    new Percentage(Math.max(0, Math.min(360, Number(opts.hue))))
                );
            } catch {}
        }

        // Exposure / Highlights / Shadows approximations via level/gamma
        if (
            typeof opts.exposure !== "undefined" &&
            Number(opts.exposure) !== 0
        ) {
            try {
                const exp = Number(opts.exposure);
                // Make positive values brighten, negative darken
                const gamma =
                    exp > 0
                        ? 1 / (1 - Math.min(0.95, exp / 220))
                        : 1 + Math.min(0.95, -exp / 220);
                // @ts-ignore
                image.gammaCorrect(gamma);
            } catch {}
        }

        // Shadows adjustment (approx): use sigmoidal contrast around low midpoint to lift/deepen shadows
        if (typeof opts.shadows !== "undefined" && Number(opts.shadows) !== 0) {
            const s = Number(opts.shadows);
            const amount = Math.max(1, Math.min(20, Math.abs(s) / 5 + 1));
            const midpoint = 0.25; // focus on shadow region
            try {
                // @ts-ignore - sigmoidalContrast(sharpen:boolean, contrast:number, midpoint:number)
                (image as any).sigmoidalContrast(
                    s < 0 /* deepen */,
                    amount,
                    midpoint
                );
                if (s > 0) {
                    // lifting shadows often benefits from slight overall gamma lift
                    // @ts-ignore
                    image.gammaCorrect(0.95);
                }
            } catch {}
        }

        // Highlights adjustment (approx): use sigmoidal contrast around high midpoint to compress/expand highlights
        if (
            typeof opts.highlights !== "undefined" &&
            Number(opts.highlights) !== 0
        ) {
            const h = Number(opts.highlights);
            const amount = Math.max(1, Math.min(20, Math.abs(h) / 5 + 1));
            const midpoint = 0.75; // focus on highlight region
            try {
                // For positive highlights (recover), reduce contrast around highlights (unsharpen)
                // For negative (boost), increase contrast around highlights (sharpen)
                // @ts-ignore
                (image as any).sigmoidalContrast(
                    h < 0 /* boost */,
                    amount,
                    midpoint
                );
                if (h > 0) {
                    // slight gamma to keep mids from getting too flat
                    // @ts-ignore
                    image.gammaCorrect(1.02);
                }
            } catch {}
        }

        if (opts.rotation && Number(opts.rotation) % 360 !== 0) {
            image.backgroundColor = new MagickColor(0, 0, 0, 0);
            image.rotate(Number(opts.rotation));
        }
        if (opts.flip) image.flip();
        if (opts.flop) image.flop();

        // Resampling filter hint where supported
        try {
            const anyImg: any = image as any;
            if (opts.resample) {
                const ft = (ImageMagick as any).FilterType;
                if (ft) {
                    switch (opts.resample) {
                        case "nearest":
                            anyImg.filterType = ft.Point;
                            break;
                        case "bilinear":
                            anyImg.filterType = ft.Triangle;
                            break;
                        case "bicubic":
                            anyImg.filterType = ft.Cubic;
                            break;
                        case "lanczos":
                        default:
                            anyImg.filterType = ft.Lanczos;
                            break;
                    }
                }
            }
        } catch {}

        // Improved Resize / Crop / Pad logic after rotation
        try {
            const boxW =
                typeof opts.boxWidth === "number"
                    ? Math.max(1, Number(opts.boxWidth) | 0)
                    : typeof opts.width === "number"
                    ? Math.max(1, Number(opts.width) | 0)
                    : 0;
            const boxH =
                typeof opts.boxHeight === "number"
                    ? Math.max(1, Number(opts.boxHeight) | 0)
                    : typeof opts.height === "number"
                    ? Math.max(1, Number(opts.height) | 0)
                    : 0;

            if (boxW > 0 && boxH > 0) {
                // Get current dimensions (post-rotation)
                // @ts-ignore
                const srcW: number = image.width;
                // @ts-ignore
                const srcH: number = image.height;

                // Validate source dimensions
                if (srcW <= 0 || srcH <= 0) {
                    throw new Error("Invalid source image dimensions");
                }

                const mode = opts.aspectMode || "preserve";

                if (mode === "force") {
                    // Force new dimension: Stretch image to fit exact canvas size
                    // This will distort the image if aspect ratios don't match
                    try {
                        // Use sample for exact pixel mapping without interpolation
                        // @ts-ignore
                        image.sample(boxW, boxH);
                    } catch (sampleError) {
                        try {
                            // Fallback: Force resize with '!' flag to ignore aspect ratio
                            // @ts-ignore
                            image.resize(`${boxW}x${boxH}!`);
                        } catch (resizeError) {
                            // Final fallback: Basic resize (may preserve aspect ratio)
                            image.resize(boxW, boxH);
                        }
                    }
                } else if (mode === "crop") {
                    // Crop to fit: Scale to fill canvas, then crop from center
                    const scaleX = boxW / srcW;
                    const scaleY = boxH / srcH;
                    const scale = Math.max(scaleX, scaleY); // Scale to fill (larger scale)

                    const newW = Math.max(1, Math.round(srcW * scale));
                    const newH = Math.max(1, Math.round(srcH * scale));

                    // First resize to fill the target area
                    image.resize(newW, newH);

                    // Calculate center crop offsets manually
                    const offsetX = Math.max(0, Math.floor((newW - boxW) / 2));
                    const offsetY = Math.max(0, Math.floor((newH - boxH) / 2));

                    // Crop from center using explicit coordinates
                    try {
                        // @ts-ignore - Use crop with geometry string for precise control
                        image.crop(new MagickGeometry(offsetX, offsetY, boxW, boxH));
                    } catch (cropError) {
                        try {
                            // Alternative: crop with individual parameters
                            // @ts-ignore
                            image.crop(boxW, boxH, offsetX, offsetY);
                        } catch (fallbackError) {
                            // Final fallback: use cropToFit if available
                            try {
                                // @ts-ignore
                                image.cropToFit(boxW, boxH);
                            } catch {
                                console.warn(
                                    "All crop methods failed, image may not be centered"
                                );
                                // @ts-ignore
                                image.crop(boxW, boxH);
                            }
                        }
                    }
                } else if (mode === "pad") {
                    // Pad to fit: Scale image to fit inside canvas, then center with padding
                    const scaleX = boxW / srcW;
                    const scaleY = boxH / srcH;
                    const scale = Math.min(scaleX, scaleY);

                    const newW = Math.max(1, Math.round(srcW * scale));
                    const newH = Math.max(1, Math.round(srcH * scale));

                    if (Math.abs(scale - 1.0) > 0.001) {
                        image.resize(newW, newH);
                    }

                    if (newW === boxW && newH === boxH) {
                        // Image already fits perfectly
                    } else {
                        const padColor = opts.padColor || {
                            r: 255,
                            g: 255,
                            b: 255,
                            a: 255,
                        };

                        try {
                            image.backgroundColor = new MagickColor(
                                padColor.r,
                                padColor.g,
                                padColor.b,
                                typeof padColor.a === "number"
                                    ? padColor.a
                                    : 255
                            );

                            // Calculate center coordinates
                            const offsetX = Math.floor((boxW - newW) / 2);
                            const offsetY = Math.floor((boxH - newH) / 2);

                            try {
                                // Method 1: Use page geometry for explicit positioning
                                // @ts-ignore
                                image.page = `${newW}x${newH}+${offsetX}+${offsetY}`;
                                // @ts-ignore
                                image.extent(boxW, boxH);
                                // @ts-ignore
                                image.page = `${boxW}x${boxH}+0+0`;
                            } catch (pageError) {
                                try {
                                    // Method 2: Use border with calculated padding
                                    const extraW = boxW - newW;
                                    const extraH = boxH - newH;

                                    if (extraW > 0 || extraH > 0) {
                                        image.borderColor = new MagickColor(
                                            padColor.r,
                                            padColor.g,
                                            padColor.b,
                                            typeof padColor.a === "number"
                                                ? padColor.a
                                                : 255
                                        );

                                        // @ts-ignore
                                        image.border(
                                            Math.floor(extraW / 2),
                                            Math.floor(extraH / 2)
                                        );

                                        // Verify and correct dimensions
                                        // @ts-ignore
                                        const currentW = image.width;
                                        // @ts-ignore
                                        const currentH = image.height;

                                        if (
                                            currentW !== boxW ||
                                            currentH !== boxH
                                        ) {
                                            if (
                                                currentW >= boxW &&
                                                currentH >= boxH
                                            ) {
                                                const cropX = Math.floor(
                                                    (currentW - boxW) / 2
                                                );
                                                const cropY = Math.floor(
                                                    (currentH - boxH) / 2
                                                );
                                                // @ts-ignore
                                                image.crop(
                                                    new MagickGeometry(cropX, cropY, boxW, boxH)
                                                );
                                            } else {
                                                // @ts-ignore
                                                image.extent(boxW, boxH);
                                            }
                                        }
                                    }
                                } catch (borderError) {
                                    // Method 3: Basic extent fallback
                                    // @ts-ignore
                                    image.extent(boxW, boxH);
                                }
                            }
                        } catch (colorError) {
                            console.warn(
                                "Could not set padding color, using white"
                            );
                            try {
                                image.backgroundColor = new MagickColor(
                                    255,
                                    255,
                                    255,
                                    255
                                );
                                // @ts-ignore
                                image.extent(boxW, boxH);
                            } catch (finalError) {
                                console.error("Padding failed completely");
                            }
                        }
                    }
                } else {
                    // Preserve aspect ratio: Fit image inside canvas (default behavior)
                    const scaleX = boxW / srcW;
                    const scaleY = boxH / srcH;
                    const scale = Math.min(scaleX, scaleY); // Scale to fit

                    const newW = Math.max(1, Math.round(srcW * scale));
                    const newH = Math.max(1, Math.round(srcH * scale));

                    // Only resize if scaling is needed
                    if (Math.abs(scale - 1.0) > 0.001) {
                        image.resize(newW, newH);
                    }
                }
            } else if (
                typeof opts.width === "number" &&
                typeof opts.height === "number" &&
                opts.width > 0 &&
                opts.height > 0
            ) {
                // Fallback: Basic resize when only width/height specified
                const targetW = Math.max(1, Number(opts.width) | 0);
                const targetH = Math.max(1, Number(opts.height) | 0);
                image.resize(targetW, targetH);
            }
        } catch (error) {
            console.error("Image resizing failed:", error);
            throw error; // Re-throw to let caller handle the error
        }

        if (opts.blur && Number(opts.blur) > 0) {
            try {
                // @ts-ignore
                image.blur(0, Number(opts.blur));
            } catch {
                // @ts-ignore
                image.blur(Number(opts.blur));
            }
        }

        if (opts.sharpen && Number(opts.sharpen) > 0) {
            const sigma = Math.max(0.2, Math.min(5, Number(opts.sharpen) / 20));
            try {
                // @ts-ignore
                image.sharpen(0, sigma);
            } catch {}
        }

        if (opts.noise && Number(opts.noise) > 0) {
            const level = Number(opts.noise);
            const radius = level < 35 ? 1 : level < 70 ? 2 : 3;
            try {
                // @ts-ignore
                image.medianFilter(radius);
            } catch {
                try {
                    // @ts-ignore
                    image.blur(0, 0.5);
                } catch {}
            }
        }

        if (opts.pixelate && Number(opts.pixelate) > 0) {
            try {
                // @ts-ignore
                const ow = image.width;
                // @ts-ignore
                const oh = image.height;
                const scale = Math.max(
                    2,
                    Math.min(50, Math.floor(Number(opts.pixelate)))
                );
                const dw = Math.max(1, Math.floor(ow / scale));
                const dh = Math.max(1, Math.floor(oh / scale));
                try {
                    // @ts-ignore
                    const FilterType =
                        (ImageMagick as any).FilterType || undefined;
                    if (FilterType) {
                        // @ts-ignore
                        image.filterType = FilterType.Point;
                    }
                } catch {}
                if (typeof (image as any).scale === "function") {
                    // @ts-ignore
                    image.scale(dw, dh);
                    // @ts-ignore
                    image.scale(ow, oh);
                } else {
                    image.resize(dw, dh);
                    image.resize(ow, oh);
                }
            } catch {}
        }

        if (opts.vignette && Number(opts.vignette) > 0) {
            try {
                const sigma = Math.max(
                    0.5,
                    Math.min(10, Number(opts.vignette) / 10)
                );
                // @ts-ignore
                image.vignette(0, sigma);
            } catch {}
        }

        if (
            typeof opts.saturation !== "undefined" &&
            Number(opts.saturation) !== 0
        ) {
            try {
                image.modulate(
                    new Percentage(100),
                    new Percentage(Math.max(0, 100 + Number(opts.saturation))),
                    new Percentage(100)
                );
            } catch {}
        }

        if (
            typeof opts.gamma !== "undefined" &&
            Number(opts.gamma) > 0 &&
            Number(opts.gamma) !== 1
        ) {
            try {
                // @ts-ignore
                image.gammaCorrect(Number(opts.gamma));
            } catch {
                try {
                    // @ts-ignore
                    image.gamma(Number(opts.gamma));
                } catch {}
            }
        }

        // Strip metadata
        if (opts.stripMetadata) {
            try {
                // @ts-ignore
                image.strip();
            } catch {}
        }

        // Output format specific tweaks
        try {
            switch (opts.format) {
                case MagickFormat.Png:
                    if (typeof opts.pngCompression !== "undefined") {
                        // @ts-ignore
                        image.defineValue(
                            "png:compression-level",
                            String(
                                Math.max(
                                    0,
                                    Math.min(9, Number(opts.pngCompression))
                                )
                            )
                        );
                    }
                    break;
                case MagickFormat.WebP:
                    if (opts.webpLossless) {
                        // @ts-ignore
                        image.defineValue("webp:lossless", "true");
                    }
                    break;
                case MagickFormat.Jpg:
                case MagickFormat.Jpeg:
                    if (opts.jpegProgressive) {
                        // @ts-ignore
                        image.defineValue("jpeg:progressive", "true");
                    }
                    if (opts.jpegOptimize) {
                        // @ts-ignore
                        image.defineValue("jpeg:optimize-coding", "true");
                    }
                    break;
            }
        } catch {}

        image.write(opts.format, (data) => {
            const mime = (() => {
                switch (opts.format) {
                    case MagickFormat.Jpg:
                    case MagickFormat.Jpeg:
                        return "image/jpeg";
                    case MagickFormat.Png:
                        return "image/png";
                    case MagickFormat.WebP:
                        return "image/webp";
                    case MagickFormat.Jxl:
                        return "image/jxl";
                    case MagickFormat.Bmp:
                        return "image/bmp";
                    case MagickFormat.Tiff:
                        return "image/tiff";
                    case MagickFormat.Ico:
                        return "image/x-icon";
                    default:
                        return `image/${String(opts.format).toLowerCase()}`;
                }
            })();
            // Create a new Uint8Array from the data to ensure it's a copy with a standard ArrayBuffer
            const blob = new Blob([new Uint8Array(data)], { type: mime });
            resolve(blob);
        });
    });
  });
};

export const ConvertOptions = ({
  setFormat,
  setQuality,
  setWidth,
  setHeight,
  setFilter,
  setBrightness,
  setContrast,
  setRotation,
  setFlip,
  setFlop,
  setBlur,
  setSharpen,
  setNoise,
  setVignette,
  setPixelate,
}: {
  setFormat: (format: MagickFormat) => void;
  setQuality: (quality: number) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setFilter: (filter: string) => void;
  setBrightness: (brightness: number) => void;
  setContrast: (contrast: number) => void;
  setRotation: (rotation: number) => void;
  setFlip: (flip: boolean) => void;
  setFlop: (flop: boolean) => void;
  setBlur: (blur: number) => void;
  setSharpen: (sharpen: number) => void;
  setNoise: (noise: number) => void;
  setVignette: (vignette: number) => void;
  setPixelate: (pixelate: number) => void;
}) => {
  return (
    <div className="flex flex-col gap-4">
      <RadioGroup
        defaultValue={MagickFormat.WebP}
        className="my-auto"
        onValueChange={(value) => setFormat(value as MagickFormat)}
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={MagickFormat.WebP} id="r1" />
          <Label htmlFor="r1">WebP</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={MagickFormat.Png} id="r2" />
          <Label htmlFor="r2">Png</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={MagickFormat.Jpg} id="r3" />
          <Label htmlFor="r3">Jpg</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={MagickFormat.Jxl} id="r4" />
          <Label htmlFor="r4">JpegXL</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={MagickFormat.Ico} id="r5" />
          <Label htmlFor="r5">Ico</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={MagickFormat.Tiff} id="r6" />
          <Label htmlFor="r6">Tiff</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value={MagickFormat.Bmp} id="r7" />
          <Label htmlFor="r7">Bmp</Label>
        </div>
      </RadioGroup>
      <div>
        <Label>Quality</Label>
        <Slider
          defaultValue={[100]}
          max={100}
          step={1}
          onValueChange={(value: number[]) => setQuality(value[0])}
        />
      </div>
      <div>
        <Label>Blur</Label>
        <Slider
          defaultValue={[0]}
          min={0}
          max={20}
          step={1}
          onValueChange={(value: number[]) => setBlur(value[0])}
        />
      </div>
      <div>
        <Label>Sharpen</Label>
        <Slider
          defaultValue={[0]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value: number[]) => setSharpen(value[0])}
        />
      </div>
      <div>
        <Label>Noise Reduction</Label>
        <Slider
          defaultValue={[0]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value: number[]) => setNoise(value[0])}
        />
      </div>
      <div>
        <Label>Vignette</Label>
        <Slider
          defaultValue={[0]}
          min={0}
          max={100}
          step={1}
          onValueChange={(value: number[]) => setVignette(value[0])}
        />
      </div>
      <div>
        <Label>Pixelate</Label>
        <Slider
          defaultValue={[0]}
          min={0}
          max={20}
          step={1}
          onValueChange={(value: number[]) => setPixelate(value[0])}
        />
      </div>
      <div className="flex gap-2">
        <div>
          <Label>Width</Label>
          <Input
            type="number"
            onChange={(e) => setWidth(parseInt(e.target.value))}
          />
        </div>
        <div>
          <Label>Height</Label>
          <Input
            type="number"
            onChange={(e) => setHeight(parseInt(e.target.value))}
          />
        </div>
      </div>
      <div>
        <Label>Filter</Label>
        <RadioGroup
          defaultValue="none"
          onValueChange={(value) => setFilter(value)}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="none" id="f1" />
            <Label htmlFor="f1">None</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="grayscale" id="f2" />
            <Label htmlFor="f2">Grayscale</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sepia" id="f3" />
            <Label htmlFor="f3">Sepia</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="invert" id="f4" />
            <Label htmlFor="f4">Invert</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="vintage" id="f5" />
            <Label htmlFor="f5">Vintage</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <Label>Brightness</Label>
        <Slider
          defaultValue={[0]}
          min={-100}
          max={100}
          step={1}
          onValueChange={(value: number[]) => setBrightness(value[0])}
        />
      </div>
      <div>
        <Label>Contrast</Label>
        <Slider
          defaultValue={[0]}
          min={-100}
          max={100}
          step={1}
          onValueChange={(value: number[]) => setContrast(value[0])}
        />
      </div>
      <div>
        <Label>Rotation</Label>
        <Slider
          defaultValue={[0]}
          min={0}
          max={360}
          step={1}
          onValueChange={(value: number[]) => setRotation(value[0])}
        />
      </div>
      <div className="flex gap-2">
        <div className="flex items-center space-x-2">
          <Input
            type="checkbox"
            id="flip"
            onChange={(e) => setFlip(e.target.checked)}
          />
          <Label htmlFor="flip">Flip</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Input
            type="checkbox"
            id="flop"
            onChange={(e) => setFlop(e.target.checked)}
          />
          <Label htmlFor="flop">Flop</Label>
        </div>
      </div>
    </div>
  );
};
