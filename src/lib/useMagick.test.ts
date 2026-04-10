import { describe, it, expect, beforeEach } from 'vitest';
import { useMagick, type MagickState } from './useMagick.svelte';
import type { MagickSettings } from './types';

describe('MagickState', () => {
	let magick: MagickState;

	beforeEach(() => {
		magick = useMagick();
	});

	describe('hexToRgb', () => {
		it('should convert 6-digit hex to RGB', () => {
			const result = magick.hexToRgb('#ff0000');
			expect(result).toEqual({ r: 255, g: 0, b: 0 });
		});

		it('should convert 3-digit hex to RGB', () => {
			const result = magick.hexToRgb('#fff');
			expect(result).toEqual({ r: 255, g: 255, b: 255 });
		});

		it('should convert hex without hash to RGB', () => {
			const result = magick.hexToRgb('00ff00');
			expect(result).toEqual({ r: 0, g: 255, b: 0 });
		});

		it('should handle black color', () => {
			const result = magick.hexToRgb('#000000');
			expect(result).toEqual({ r: 0, g: 0, b: 0 });
		});

		it('should handle white color without hash', () => {
			const result = magick.hexToRgb('ffffff');
			expect(result).toEqual({ r: 255, g: 255, b: 255 });
		});

		it('should handle blue color', () => {
			const result = magick.hexToRgb('#0000ff');
			expect(result).toEqual({ r: 0, g: 0, b: 255 });
		});

		it('should handle gray color', () => {
			const result = magick.hexToRgb('#808080');
			expect(result).toEqual({ r: 128, g: 128, b: 128 });
		});
	});

	describe('resetExport', () => {
		it('should reset export settings', () => {
			magick.settings.imageFormat = 'PNG';
			magick.settings.quality = [50];
			magick.settings.stripMeta = false;

			magick.resetExport();

			expect(magick.settings.imageFormat).toBe('WebP');
			expect(magick.settings.quality).toEqual([85]);
			expect(magick.settings.stripMeta).toBe(true);
		});
	});

	describe('hexToRgb edge cases', () => {
		it('should handle invalid hex without crashing', () => {
			const result = magick.hexToRgb('#xyz');
			expect(Number.isNaN(result.r) || result.r === 0).toBe(true);
		});

		it('should handle empty string edge case', () => {
			const result = magick.hexToRgb('');
			expect(result.r).toBeLessThanOrEqual(0);
		});
	});

	describe('clearSource', () => {
		it('should clear source bytes and URLs', () => {
			magick.sourceBytes = new Uint8Array([1, 2, 3]);
			magick.originalImageUrl = 'blob:http://test';

			magick.clearSource();

			expect(magick.sourceBytes).toBeNull();
			expect(magick.originalImageUrl).toBeNull();
		});
	});

	describe('resetGeometry', () => {
		it('should reset all geometry settings', () => {
			magick.settings.resizeW = 800;
			magick.settings.resizeH = 600;
			magick.settings.rotate = '90';
			magick.settings.flip = true;
			magick.settings.flop = true;

			magick.resetGeometry();

			expect(magick.settings.resizeW).toBeNull();
			expect(magick.settings.resizeH).toBeNull();
			expect(magick.settings.rotate).toBe('0');
			expect(magick.settings.flip).toBe(false);
			expect(magick.settings.flop).toBe(false);
		});
	});

	describe('resetColor', () => {
		it('should reset all color settings', () => {
			magick.settings.brightness = [150];
			magick.settings.saturation = [200];
			magick.settings.hue = [50];
			magick.settings.contrast = [25];
			magick.settings.normalizeImage = true;
			magick.settings.colorSpace = 'Gray';

			magick.resetColor();

			expect(magick.settings.brightness).toEqual([100]);
			expect(magick.settings.saturation).toEqual([100]);
			expect(magick.settings.hue).toEqual([100]);
			expect(magick.settings.contrast).toEqual([0]);
			expect(magick.settings.normalizeImage).toBe(false);
			expect(magick.settings.colorSpace).toBe('RGB');
		});
	});
	describe('resetSettings', () => {
		it('should reset all settings', () => {
			magick.settings.resizeW = 800;
			magick.settings.imageFormat = 'PNG';
			magick.settings.brightness = [150];
			magick.settings.effect = 'grayscale';

			magick.resetSettings();

			expect(magick.settings.resizeW).toBeNull();
			expect(magick.settings.imageFormat).toBe('WebP');
			expect(magick.settings.brightness).toEqual([100]);
			expect(magick.settings.effect).toBe('none');
		});
	});

	describe('state initialization', () => {
		it('should initialize with correct default values', () => {
			expect(magick.wasmLoaded).toBe(false);
			expect(magick.isLoading).toBe(false);
			expect(magick.statsMessage).toBe('Ready');
			expect(magick.sourceBytes).toBeNull();
			expect(magick.originalImageUrl).toBeNull();
			expect(magick.processedImageUrl).toBeNull();
		});

		it('should have correct default settings', () => {
			expect(magick.settings.imageFormat).toBe('WebP');
			expect(magick.settings.quality).toEqual([85]);
			expect(magick.settings.stripMeta).toBe(true);
			expect(magick.settings.rotate).toBe('0');
			expect(magick.settings.effect).toBe('none');
		});
	});
});

describe('MagickSettings type', () => {
	it('should have all required properties', () => {
		const settings: MagickSettings = {
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

		expect(settings.imageFormat).toBe('WebP');
		expect(settings.quality[0]).toBe(85);
	});
});
