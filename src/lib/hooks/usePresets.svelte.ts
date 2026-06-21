/**
 * usePresets - built-in and user-defined processing presets.
 *
 * Built-in presets are partial patches applied on top of default settings
 * (so a preset always produces the same result regardless of current state).
 * User presets are full MagickSettings snapshots saved from the current state.
 *
 * User presets persist to `localStorage` under `wasmagick.presets.v1`.
 */

import type { MagickState } from '$lib/useMagick.svelte';
import { DEFAULT_SETTINGS } from '$lib/useMagick.svelte';
import type { MagickSettings } from '$lib/types';

export interface BuiltInPreset {
	id: string;
	name: string;
	description: string;
	patch: Partial<MagickSettings>;
}

export interface UserPreset {
	id: string;
	name: string;
	settings: MagickSettings;
	createdAt: number;
}

const STORAGE_KEY = 'wasmagick.presets.v1';

function clonePatch(patch: Partial<MagickSettings>): Partial<MagickSettings> {
	const out: Record<string, unknown> = {};
	for (const [k, v] of Object.entries(patch)) {
		out[k] = Array.isArray(v) ? [...(v as unknown[])] : v;
	}
	return out as Partial<MagickSettings>;
}

function snapSettings(settings: MagickSettings): MagickSettings {
	return JSON.parse(JSON.stringify(settings));
}

/** Stable serialized form of a settings object, for equality comparison. */
function settingsKey(settings: MagickSettings): string {
	return JSON.stringify(settings);
}

/** The settings a built-in preset would produce if applied now. */
function builtInExpected(preset: BuiltInPreset): MagickSettings {
	return snapSettings({ ...DEFAULT_SETTINGS, ...clonePatch(preset.patch) });
}

export const BUILTIN_PRESETS: BuiltInPreset[] = [
	{
		id: 'web-shrink',
		name: 'Web Shrink',
		description: '1600px wide · WebP · q80',
		patch: { resizeW: 1600, resizeH: null, imageFormat: 'WebP', quality: [80], stripMeta: true }
	},
	{
		id: 'thumbnail',
		name: 'Thumbnail',
		description: '256×256 · WebP · q85',
		patch: { resizeW: 256, resizeH: 256, imageFormat: 'WebP', quality: [85], stripMeta: true }
	},
	{
		id: 'bw-photo',
		name: 'B&W Photo',
		description: 'Grayscale · normalized · +15 contrast',
		patch: { effect: 'grayscale', contrast: [15], normalizeImage: true }
	},
	{
		id: 'sepia-vintage',
		name: 'Sepia Vintage',
		description: 'Sepia · warm · soft',
		patch: { effect: 'sepia', sepiaThreshold: [80], saturation: [90], brightness: [105] }
	},
	{
		id: 'sharpen-scan',
		name: 'Sharpen Scan',
		description: 'Grayscale · sharpen · +20 contrast',
		patch: { effect: 'grayscale', sharpen: [2], contrast: [20], normalizeImage: true }
	},
	{
		id: 'social-square',
		name: 'Social Square',
		description: '1080² canvas · centered · q90',
		patch: {
			extentW: 1080,
			extentH: 1080,
			extentGravity: 'Center',
			extentBgColor: '#ffffff',
			imageFormat: 'WebP',
			quality: [90]
		}
	},
	{
		id: 'hq-png',
		name: 'HQ PNG',
		description: 'PNG · lossless · keep metadata',
		patch: { imageFormat: 'PNG', stripMeta: false }
	}
];

export class PresetsState {
	userPresets = $state<UserPreset[]>([]);
	loaded = $state(false);

	/** Load user presets from localStorage. Call on mount. */
	load(): void {
		if (this.loaded) return;
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as UserPreset[];
				if (Array.isArray(parsed)) this.userPresets = parsed;
			}
		} catch {
			// ignore corrupt storage
		}
		this.loaded = true;
	}

	private persist(): void {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userPresets));
		} catch {
			// ignore quota / private mode
		}
	}

	applyBuiltIn(magick: MagickState, preset: BuiltInPreset): void {
		magick.resetSettings();
		const patch = clonePatch(preset.patch);
		Object.assign(magick.settings, patch);
	}

	applyUser(magick: MagickState, preset: UserPreset): void {
		magick.settings = snapSettings(preset.settings);
	}

	/** True when the live settings exactly match what this built-in would produce. */
	isBuiltInActive(magick: MagickState, preset: BuiltInPreset): boolean {
		return settingsKey(magick.settings) === settingsKey(builtInExpected(preset));
	}

	/** True when the live settings exactly match this user preset's snapshot. */
	isUserActive(magick: MagickState, preset: UserPreset): boolean {
		return settingsKey(magick.settings) === settingsKey(preset.settings);
	}

	saveUser(name: string, magick: MagickState): UserPreset {
		const preset: UserPreset = {
			id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
			name: name.trim() || 'Untitled Preset',
			settings: snapSettings(magick.settings),
			createdAt: Date.now()
		};
		this.userPresets = [...this.userPresets, preset];
		this.persist();
		return preset;
	}

	deleteUser(id: string): void {
		this.userPresets = this.userPresets.filter((p) => p.id !== id);
		this.persist();
	}

	renameUser(id: string, name: string): void {
		this.userPresets = this.userPresets.map((p) =>
			p.id === id ? { ...p, name: name.trim() || p.name } : p
		);
		this.persist();
	}
}

export function usePresets(): PresetsState {
	return new PresetsState();
}
