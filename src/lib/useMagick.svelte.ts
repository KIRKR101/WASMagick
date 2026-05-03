/**
 * WASMagick - WebAssembly ImageMagick for the Browser
 *
 * A Svelte-powered image editor that uses ImageMagick WASM to perform
 * client-side image processing including resizing, rotation, color
 * adjustments, filters, and format conversion.
 *
 * @module useMagick
 * @requires @imagemagick/magick-wasm
 */

import {
	ImageMagick,
	Magick,
	initializeImageMagick,
	MagickFormat,
	Percentage,
	MagickColor,
	Gravity,
	Channels,
	ColorSpace
} from '@imagemagick/magick-wasm';
import { toast } from 'svelte-sonner';
import type { MagickSettings, AppliedOptions } from './types';

const DEFAULT_SETTINGS: MagickSettings = {
	imageFormat: 'WebP',
	quality: [85],
	stripMeta: true,
	resizeW: null,
	resizeH: null,
	rotate: '0',
	flop: false,
	flip: false,
	borderColor: '#ffffff',
	borderSize: [0],
	extentW: null,
	extentH: null,
	extentGravity: 'Center',
	extentBgColor: '#ffffff',
	deskewThreshold: [0],
	deskewAutoCrop: true,
	brightness: [100],
	saturation: [100],
	hue: [100],
	contrast: [0],
	normalizeImage: false,
	autoLevel: false,
	autoOrient: false,
	levelBlackpoint: [0],
	levelWhitepoint: [100],
	levelGamma: [1.0],
	levelChannels: 'All',
	thresholdPercentage: [50],
	thresholdChannels: 'All',
	sigmoidalContrast: [0],
	sigmoidalMidpoint: [50],
	sigmoidalChannels: 'All',
	colorSpace: 'RGB',
	effect: 'none',
	blur: [0],
	sharpen: [0],
	sepiaThreshold: [80],
	charcoalIntensity: [0],
	cannyEdgeStrength: [0],
	cannyEdgeLower: [10],
	cannyEdgeUpper: [30],
	oilpaintRadius: [0],
	solarizeFactor: [50],
	bilateralWidth: [0],
	bilateralHeight: [0],
	bilateralIntensitySigma: [1.5],
	bilateralSpatialSigma: [1]
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const SUPPORTED_MIME_TYPES = [
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	'image/tiff',
	'image/bmp',
	'image/avif'
];

const FORMAT_MAP: Record<string, keyof typeof MagickFormat> = {
	WEBP: 'WebP',
	JPEG: 'Jpeg',
	PNG: 'Png',
	AVIF: 'Avif',
	JXL: 'Jxl',
	TIFF: 'Tiff',
	GIF: 'Gif'
};

export class MagickState {
	wasmLoaded = $state(false);
	isLoading = $state(false);
	hasError = $state(false);
	errorMessage = $state<string | null>(null);
	statsMessage = $state('Ready');
	sourceBytes = $state<Uint8Array | null>(null);
	originalName = $state('image');
	originalImageSize = $state(0);
	originalImageUrl = $state<string | null>(null);
	originalImageFormat = $state<string | null>(null);
	processedImageUrl = $state<string | null>(null);
	processedImageFormat = $state<string | null>(null);
	processedImageName = $state<string | null>(null);
	originalWidth = $state(0);
	originalHeight = $state(0);
	processedWidth = $state(0);
	processedHeight = $state(0);
	currentProcessingStep = $state<string | null>(null);
	settings = $state<MagickSettings>({ ...DEFAULT_SETTINGS });

	hexToRgb(hex: string): { r: number; g: number; b: number } {
		let r = 0,
			g = 0,
			b = 0;
		if (hex.startsWith('#')) hex = hex.slice(1);
		const isValid = /^[0-9a-fA-F]+$/.test(hex) && (hex.length === 3 || hex.length === 6);
		if (!isValid) return { r: 0, g: 0, b: 0 };
		if (hex.length === 3) {
			r = parseInt(hex[0] + hex[0], 16);
			g = parseInt(hex[1] + hex[1], 16);
			b = parseInt(hex[2] + hex[2], 16);
		} else if (hex.length === 6) {
			r = parseInt(hex.substring(0, 2), 16);
			g = parseInt(hex.substring(2, 4), 16);
			b = parseInt(hex.substring(4, 6), 16);
		}
		return { r, g, b };
	}

	async initWasm(debugMode = false): Promise<void> {
		try {
			const response = await fetch('/magick.wasm', { cache: 'force-cache' });
			if (!response.ok) {
				throw new Error(`Failed to fetch WASM: ${response.status}`);
			}
			const wasmBytes = new Uint8Array(await response.arrayBuffer());
			await initializeImageMagick(wasmBytes);
			this.wasmLoaded = true;

			if (debugMode) {
				console.log('ImageMagick WASM loaded, Version:', Magick.imageMagickVersion);
			}
		} catch (e) {
			this.statsMessage = 'Error Loading WASM';
			this.hasError = true;
			const message = e instanceof Error ? e.message : 'Unknown error';
			this.errorMessage = message;
			console.error('WASM initialization failed:', message);
			toast.error('Failed to Load Engine', {
				description:
					'Please refresh the page and try again. If the problem persists, your browser may not support WebAssembly.'
			});
			throw e;
		}
	}

	private validateFile(file: File): { isValid: boolean; error?: string } {
		if (!file) {
			return { isValid: false, error: 'No file provided' };
		}

		if (file.size > MAX_FILE_SIZE) {
			return {
				isValid: false,
				error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
			};
		}

		if (!SUPPORTED_MIME_TYPES.includes(file.type)) {
			return {
				isValid: false,
				error: `Unsupported format: ${file.type || 'unknown'}. Supported: JPEG, PNG, GIF, WebP, TIFF, BMP, AVIF`
			};
		}

		return { isValid: true };
	}

	resetGeometry(): void {
		this.settings.resizeW = DEFAULT_SETTINGS.resizeW;
		this.settings.resizeH = DEFAULT_SETTINGS.resizeH;
		this.settings.rotate = DEFAULT_SETTINGS.rotate;
		this.settings.flop = DEFAULT_SETTINGS.flop;
		this.settings.flip = DEFAULT_SETTINGS.flip;
		this.settings.borderColor = DEFAULT_SETTINGS.borderColor;
		this.settings.borderSize = [...DEFAULT_SETTINGS.borderSize];
		this.settings.extentW = DEFAULT_SETTINGS.extentW;
		this.settings.extentH = DEFAULT_SETTINGS.extentH;
		this.settings.extentGravity = DEFAULT_SETTINGS.extentGravity;
		this.settings.extentBgColor = DEFAULT_SETTINGS.extentBgColor;
		this.settings.deskewThreshold = [...DEFAULT_SETTINGS.deskewThreshold];
		this.settings.deskewAutoCrop = DEFAULT_SETTINGS.deskewAutoCrop;
	}

	resetColor(): void {
		this.settings.brightness = [...DEFAULT_SETTINGS.brightness];
		this.settings.saturation = [...DEFAULT_SETTINGS.saturation];
		this.settings.hue = [...DEFAULT_SETTINGS.hue];
		this.settings.contrast = [...DEFAULT_SETTINGS.contrast];
		this.settings.colorSpace = DEFAULT_SETTINGS.colorSpace;
		this.settings.normalizeImage = DEFAULT_SETTINGS.normalizeImage;
		this.settings.autoLevel = DEFAULT_SETTINGS.autoLevel;
		this.settings.autoOrient = DEFAULT_SETTINGS.autoOrient;
		this.settings.levelBlackpoint = [...DEFAULT_SETTINGS.levelBlackpoint];
		this.settings.levelWhitepoint = [...DEFAULT_SETTINGS.levelWhitepoint];
		this.settings.levelGamma = [...DEFAULT_SETTINGS.levelGamma];
		this.settings.levelChannels = DEFAULT_SETTINGS.levelChannels;
		this.settings.thresholdPercentage = [...DEFAULT_SETTINGS.thresholdPercentage];
		this.settings.thresholdChannels = DEFAULT_SETTINGS.thresholdChannels;
		this.settings.sigmoidalContrast = [...DEFAULT_SETTINGS.sigmoidalContrast];
		this.settings.sigmoidalMidpoint = [...DEFAULT_SETTINGS.sigmoidalMidpoint];
		this.settings.sigmoidalChannels = DEFAULT_SETTINGS.sigmoidalChannels;
	}

	resetFilters(): void {
		this.settings.effect = DEFAULT_SETTINGS.effect;
		this.settings.blur = [...DEFAULT_SETTINGS.blur];
		this.settings.sharpen = [...DEFAULT_SETTINGS.sharpen];
		this.settings.sepiaThreshold = [...DEFAULT_SETTINGS.sepiaThreshold];
		this.settings.charcoalIntensity = [...DEFAULT_SETTINGS.charcoalIntensity];
		this.settings.cannyEdgeStrength = [...DEFAULT_SETTINGS.cannyEdgeStrength];
		this.settings.cannyEdgeLower = [...DEFAULT_SETTINGS.cannyEdgeLower];
		this.settings.cannyEdgeUpper = [...DEFAULT_SETTINGS.cannyEdgeUpper];
		this.settings.oilpaintRadius = [...DEFAULT_SETTINGS.oilpaintRadius];
		this.settings.solarizeFactor = [...DEFAULT_SETTINGS.solarizeFactor];
		this.settings.bilateralWidth = [...DEFAULT_SETTINGS.bilateralWidth];
		this.settings.bilateralHeight = [...DEFAULT_SETTINGS.bilateralHeight];
		this.settings.bilateralIntensitySigma = [...DEFAULT_SETTINGS.bilateralIntensitySigma];
		this.settings.bilateralSpatialSigma = [...DEFAULT_SETTINGS.bilateralSpatialSigma];
	}

	resetExport(): void {
		this.settings.imageFormat = DEFAULT_SETTINGS.imageFormat;
		this.settings.quality = [...DEFAULT_SETTINGS.quality];
		this.settings.stripMeta = DEFAULT_SETTINGS.stripMeta;
	}

	resetSettings(): void {
		this.resetExport();
		this.resetGeometry();
		this.resetColor();
		this.resetFilters();
	}

	async setSourceFile(file: File): Promise<boolean> {
		this.hasError = false;
		this.errorMessage = null;

		const validation = this.validateFile(file);
		if (!validation.isValid) {
			toast.error('Invalid File', { description: validation.error });
			return false;
		}

		this.originalName = file.name;

		let format = file.type ? file.type.split('/')[1] : null;
		if (!format) {
			const nameParts = file.name.split('.');
			format = nameParts.length > 1 ? nameParts.pop() : null;
		}
		this.originalImageFormat = format ? format.toLowerCase() : null;

		try {
			const buffer = await file.arrayBuffer();
			this.sourceBytes = new Uint8Array(buffer);
			this.originalImageSize = this.sourceBytes.length;

			await this.getImageDimensions(this.sourceBytes).then((dims) => {
				this.originalWidth = dims.width;
				this.originalHeight = dims.height;
			});

			this.revokeImageUrls();
			this.originalImageUrl = URL.createObjectURL(
				new Blob([this.sourceBytes as unknown as BlobPart])
			);

			this.processedImageFormat = null;
			this.processedImageName = null;
			this.processedWidth = 0;
			this.processedHeight = 0;

			this.statsMessage = 'Ready';
			return true;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to read file';
			toast.error('Failed to Load Image', { description: message });
			return false;
		}
	}

	private async getImageDimensions(bytes: Uint8Array): Promise<{ width: number; height: number }> {
		return new Promise((resolve) => {
			const blob = new Blob([bytes as unknown as BlobPart]);
			const url = URL.createObjectURL(blob);
			const img = new Image();
			img.onload = () => {
				URL.revokeObjectURL(url);
				resolve({ width: img.width, height: img.height });
			};
			img.onerror = () => {
				URL.revokeObjectURL(url);
				resolve({ width: 0, height: 0 });
			};
			img.src = url;
		});
	}

	clearSource(): void {
		this.sourceBytes = null;
		this.revokeImageUrls();
		this.originalImageUrl = null;
		this.originalImageFormat = null;
		this.processedImageUrl = null;
		this.processedImageFormat = null;
		this.processedImageName = null;
		this.statsMessage = 'Ready';
	}

	private revokeImageUrls(): void {
		if (this.originalImageUrl) {
			URL.revokeObjectURL(this.originalImageUrl);
			this.originalImageUrl = null;
		}
		if (this.processedImageUrl) {
			URL.revokeObjectURL(this.processedImageUrl);
			this.processedImageUrl = null;
		}
	}

	processImage(debugMode = false, onComplete?: () => void): void {
		this.hasError = false;
		this.errorMessage = null;

		if (!this.sourceBytes) {
			toast.error('No Image', { description: 'Please upload an image first.' });
			return;
		}

		if (!this.wasmLoaded) {
			toast.error('Not Ready', { description: 'Please wait for WASM to initialize.' });
			return;
		}

		this.isLoading = true;

		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				const startTime = performance.now();
				const appliedOptions: AppliedOptions = {};

				try {
					ImageMagick.read(this.sourceBytes!, (image) => {
						try {
							if (image.format) {
								this.originalImageFormat = String(image.format).toLowerCase();
							}

							const resizeW = this.settings.resizeW ?? 0;
							const resizeH = this.settings.resizeH ?? 0;

							if (resizeW > 0 || resizeH > 0) {
								this.currentProcessingStep = 'Resizing';
								image.resize(resizeW, resizeH);
								appliedOptions.resize = { width: resizeW, height: resizeH };
							}

							if (parseInt(this.settings.rotate) !== 0) {
								this.currentProcessingStep = 'Rotating';
								image.rotate(parseInt(this.settings.rotate));
								appliedOptions.rotate = parseInt(this.settings.rotate);
							}

							if (this.settings.flop) {
								this.currentProcessingStep = 'Flopping';
								image.flop();
								appliedOptions.flop = true;
							}
							if (this.settings.flip) {
								this.currentProcessingStep = 'Flipping';
								image.flip();
								appliedOptions.flip = true;
							}

							if (this.settings.borderSize[0] > 0) {
								this.currentProcessingStep = 'Adding Border';
								const { r, g, b } = this.hexToRgb(this.settings.borderColor);
								image.borderColor = new MagickColor(r, g, b);
								image.border(this.settings.borderSize[0]);
								appliedOptions.border = {
									size: this.settings.borderSize[0],
									color: this.settings.borderColor
								};
							}

							if ((this.settings.extentW ?? 0) > 0 || (this.settings.extentH ?? 0) > 0) {
								this.currentProcessingStep = 'Adjusting Canvas';
								const { r, g, b } = this.hexToRgb(this.settings.extentBgColor);
								image.backgroundColor = new MagickColor(r, g, b);
								const gravityKey = this.settings.extentGravity as keyof typeof Gravity;
								image.extent(
									this.settings.extentW ?? image.width,
									this.settings.extentH ?? image.height,
									Gravity[gravityKey]
								);
								appliedOptions.extent = {
									width: this.settings.extentW,
									height: this.settings.extentH,
									gravity: this.settings.extentGravity,
									bg: this.settings.extentBgColor
								};
							}

							if (this.settings.deskewThreshold[0] > 0) {
								this.currentProcessingStep = 'Deskewing';
								image.deskew(
									new Percentage(this.settings.deskewThreshold[0]),
									this.settings.deskewAutoCrop
								);
								appliedOptions.deskew = {
									threshold: this.settings.deskewThreshold[0],
									autoCrop: this.settings.deskewAutoCrop
								};
							}

							if (
								this.settings.brightness[0] !== 100 ||
								this.settings.saturation[0] !== 100 ||
								this.settings.hue[0] !== 100
							) {
								this.currentProcessingStep = 'Adjusting Color';
								image.modulate(
									new Percentage(this.settings.brightness[0]),
									new Percentage(this.settings.saturation[0]),
									new Percentage(this.settings.hue[0])
								);
								appliedOptions.modulate = {
									brightness: this.settings.brightness[0],
									saturation: this.settings.saturation[0],
									hue: this.settings.hue[0]
								};
							}

							if (this.settings.contrast[0] !== 0) {
								this.currentProcessingStep = 'Adjusting Contrast';
								image.brightnessContrast(
									new Percentage(0),
									new Percentage(this.settings.contrast[0])
								);
								appliedOptions.contrast = this.settings.contrast[0];
							}

							if (this.settings.normalizeImage) {
								this.currentProcessingStep = 'Normalizing';
								image.normalize();
								appliedOptions.normalize = true;
							}

							if (this.settings.autoLevel) {
								this.currentProcessingStep = 'Auto-Leveling';
								image.autoLevel();
								appliedOptions.autoLevel = true;
							}

							if (this.settings.autoOrient) {
								this.currentProcessingStep = 'Auto-Orienting';
								image.autoOrient();
								appliedOptions.autoOrient = true;
							}

							if (
								this.settings.levelBlackpoint[0] !== 0 ||
								this.settings.levelWhitepoint[0] !== 100 ||
								this.settings.levelGamma[0] !== 1.0
							) {
								const channels =
									this.settings.levelChannels === 'All'
										? Channels.All
										: Channels[this.settings.levelChannels as keyof typeof Channels];
								image.level(
									new Percentage(this.settings.levelBlackpoint[0]),
									new Percentage(this.settings.levelWhitepoint[0]),
									this.settings.levelGamma[0],
									channels as Channels
								);
								appliedOptions.level = {
									black: this.settings.levelBlackpoint[0],
									white: this.settings.levelWhitepoint[0],
									gamma: this.settings.levelGamma[0],
									channels: this.settings.levelChannels
								};
							}

							if (this.settings.thresholdPercentage[0] !== 50) {
								const thresholdChannels =
									this.settings.thresholdChannels === 'All'
										? Channels.All
										: Channels[this.settings.thresholdChannels as keyof typeof Channels];
								image.threshold(
									new Percentage(this.settings.thresholdPercentage[0]),
									thresholdChannels as Channels
								);
								appliedOptions.threshold = {
									percent: this.settings.thresholdPercentage[0],
									channels: this.settings.thresholdChannels
								};
							}

							if (this.settings.sigmoidalContrast[0] !== 0) {
								const sigmoidalChannels =
									this.settings.sigmoidalChannels === 'All'
										? Channels.All
										: Channels[this.settings.sigmoidalChannels as keyof typeof Channels];
								image.sigmoidalContrast(
									this.settings.sigmoidalContrast[0],
									this.settings.sigmoidalMidpoint[0],
									sigmoidalChannels as Channels
								);
								appliedOptions.sigmoidal = {
									contrast: this.settings.sigmoidalContrast[0],
									midpoint: this.settings.sigmoidalMidpoint[0]
								};
							}

							if (this.settings.colorSpace !== 'RGB') {
								const colorSpaceKey = this.settings.colorSpace as keyof typeof ColorSpace;
								image.colorSpace = ColorSpace[colorSpaceKey];
								appliedOptions.colorSpace = this.settings.colorSpace;
							}

							if (this.settings.blur[0] > 0) {
								this.currentProcessingStep = 'Blurring';
								image.blur(this.settings.blur[0], this.settings.blur[0] / 2);
								appliedOptions.blur = this.settings.blur[0];
							}

							if (this.settings.sharpen[0] > 0) {
								this.currentProcessingStep = 'Sharpening';
								const radius = this.settings.sharpen[0];
								const sigma = radius / 2;
								image.sharpen(radius, sigma);
								appliedOptions.sharpen = this.settings.sharpen[0];
							}

							if (this.settings.effect !== 'none') {
								appliedOptions.effect = this.settings.effect;
								switch (this.settings.effect) {
									case 'grayscale':
										this.currentProcessingStep = 'Applying Grayscale';
										image.grayscale();
										break;
									case 'sepia':
										this.currentProcessingStep = 'Applying Sepia';
										image.sepiaTone(new Percentage(this.settings.sepiaThreshold[0]));
										appliedOptions.sepiaThreshold = this.settings.sepiaThreshold[0];
										break;
									case 'charcoal': {
										this.currentProcessingStep = 'Applying Charcoal';
										const charcoalRadius = this.settings.charcoalIntensity[0];
										if (charcoalRadius > 0) {
											image.charcoal(charcoalRadius, charcoalRadius / 2);
											appliedOptions.charcoalIntensity = charcoalRadius;
										} else {
											image.charcoal();
										}
										break;
									}
									case 'negate':
										this.currentProcessingStep = 'Applying Negative';
										image.negate();
										break;
									case 'cannyEdge': {
										this.currentProcessingStep = 'Detecting Edges';
										const radius = (this.settings.cannyEdgeStrength[0] / 100) * 4;
										const sigma = (this.settings.cannyEdgeStrength[0] / 100) * 1.5;
										image.cannyEdge(
											radius,
											sigma,
											new Percentage(this.settings.cannyEdgeLower[0]),
											new Percentage(this.settings.cannyEdgeUpper[0])
										);
										appliedOptions.cannyEdge = {
											strength: this.settings.cannyEdgeStrength[0],
											lower: this.settings.cannyEdgeLower[0],
											upper: this.settings.cannyEdgeUpper[0]
										};
										break;
									}
									case 'oilpaint':
										this.currentProcessingStep = 'Applying Oil Paint';
										image.oilPaint(this.settings.oilpaintRadius[0]);
										appliedOptions.oilPaintRadius = this.settings.oilpaintRadius[0];
										break;
									case 'solarize':
										this.currentProcessingStep = 'Applying Solarize';
										image.solarize(new Percentage(this.settings.solarizeFactor[0]));
										appliedOptions.solarizeFactor = this.settings.solarizeFactor[0];
										break;
									case 'bilateralBlur': {
										this.currentProcessingStep = 'Applying Bilateral Blur';
										image.bilateralBlur(
											this.settings.bilateralWidth[0],
											this.settings.bilateralHeight[0],
											this.settings.bilateralIntensitySigma[0],
											this.settings.bilateralSpatialSigma[0]
										);
										appliedOptions.bilateral = {
											w: this.settings.bilateralWidth[0],
											h: this.settings.bilateralHeight[0],
											iSig: this.settings.bilateralIntensitySigma[0],
											sSig: this.settings.bilateralSpatialSigma[0]
										};
										break;
									}
								}
							}

							if (this.settings.stripMeta) {
								image.strip();
								appliedOptions.stripMeta = true;
							}

							const formatKey = this.settings.imageFormat.toUpperCase();
							const magf = FORMAT_MAP[formatKey] || 'WebP';

							image.quality = this.settings.quality[0];
							appliedOptions.quality = this.settings.quality[0];
							appliedOptions.format = magf;

							const finalWidth = image.width;
							const finalHeight = image.height;

							image.write(MagickFormat[magf], (data) => {
								const endTime = performance.now();

								if (debugMode) {
									appliedOptions.outputDimensions = { width: finalWidth, height: finalHeight };
									appliedOptions.outputSize = data.length;
									appliedOptions.processTime = Math.round(endTime - startTime) + 'ms';
									console.log('ImageMagickSettings', appliedOptions);
								}

								this.handleDownload(
									data,
									this.settings.imageFormat,
									Math.round(endTime - startTime),
									finalWidth,
									finalHeight,
									appliedOptions
								);

								if (onComplete) onComplete();
							});
						} catch (err: unknown) {
							console.error('Image processing failed:', err);
							const message = err instanceof Error ? err.message : 'Unknown error';
							this.hasError = true;
							this.errorMessage = message;
							toast.error('Processing Failed', { description: message });
							this.isLoading = false;
						}
					});
				} catch (err: unknown) {
					console.error('Image processing failed:', err);
					const message = err instanceof Error ? err.message : 'Unknown error';
					toast.error('Processing Failed', { description: message });
					this.isLoading = false;
				}
			});
		});
	}

	handleDownload(
		data: Uint8Array,
		format: string,
		time: number,
		newWidth: number,
		newHeight: number,
		_appliedOptions: AppliedOptions
	): void {
		const mimeType = `image/${format.toLowerCase()}`;
		const blob = new Blob([data as unknown as BlobPart], { type: mimeType });

		if (this.processedImageUrl) {
			URL.revokeObjectURL(this.processedImageUrl);
		}

		this.processedImageUrl = URL.createObjectURL(blob);
		this.processedImageFormat = format.toLowerCase();
		this.processedWidth = newWidth;
		this.processedHeight = newHeight;

		const nameParts = this.originalName.split('.');
		if (nameParts.length > 1) nameParts.pop();
		const baseName = nameParts.join('.') || this.originalName;
		this.processedImageName = `${baseName}-edited.${this.processedImageFormat}`;

		this.isLoading = false;
		this.currentProcessingStep = null;

		const newSizeKB = (blob.size / 1024).toFixed(1);
		const percentageChange =
			this.originalImageSize > 0
				? (((blob.size - this.originalImageSize) / this.originalImageSize) * 100).toFixed(1)
				: 'N/A';
		const sizeChangeStr =
			this.originalImageSize > 0
				? `${newSizeKB} KB (${Number(percentageChange) > 0 ? '+' : ''}${percentageChange}%)`
				: `${newSizeKB} KB`;

		const statsStr = `Processed in ${time}ms, New Size: ${sizeChangeStr}`;
		this.statsMessage = statsStr;

		toast.success('Image Processed', {
			description: `${newWidth}×${newHeight} • ${sizeChangeStr}`
		});
	}

	downloadImage(): void {
		if (this.processedImageUrl && this.processedImageName) {
			const a = document.createElement('a');
			a.href = this.processedImageUrl;
			a.download = this.processedImageName;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
		}
	}
}

export function useMagick(): MagickState {
	return new MagickState();
}
