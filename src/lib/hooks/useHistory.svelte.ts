/**
 * useHistory - undo/redo stack for image processing states.
 *
 * Each entry stores the settings snapshot AND a blob URL for the processed
 * result, so undo/redo are instant (no re-processing). History owns its own
 * blob URLs (cloned from magick's) so magick's lifecycle (which revokes its
 * own URLs on the next process) never invalidates history entries.
 *
 * Cap is 40 entries; oldest is evicted (FIFO) with URL revoke.
 */

import type { MagickState } from '$lib/useMagick.svelte';
import type { MagickSettings } from '$lib/types';

export interface HistoryEntry {
	id: number;
	label: string;
	settings: MagickSettings;
	/** History-owned blob URL. Survives magick re-processing. */
	blobUrl: string;
	width: number;
	height: number;
	format: string;
	size: number;
	/** Processing time in ms; 0 for the Original entry. */
	time: number;
	/** Creation timestamp. */
	ts: number;
	isOriginal: boolean;
	statsMessage: string;
}

const MAX_ENTRIES = 40;

async function cloneBlobUrl(url: string): Promise<string> {
	const blob = await fetch(url).then((r) => r.blob());
	return URL.createObjectURL(blob);
}

function snapSettings(settings: MagickSettings): MagickSettings {
	return JSON.parse(JSON.stringify(settings));
}

let nextId = 1;

export class HistoryState {
	entries = $state<HistoryEntry[]>([]);
	/** Index of the current state within `entries`, -1 when empty. */
	pointer = $state(-1);

	// Non-reactive internal set tracking blob URLs pending revoke.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	private _urlsToRevoke: Set<string> = new Set();

	get canUndo(): boolean {
		return this.pointer > 0;
	}
	get canRedo(): boolean {
		return this.pointer < this.entries.length - 1;
	}
	get current(): HistoryEntry | null {
		return this.pointer >= 0 ? this.entries[this.pointer] : null;
	}
	get count(): number {
		return this.entries.length;
	}

	/** Reset history to a single Original entry. Called after a new file loads. */
	async resetToOriginal(magick: MagickState): Promise<void> {
		this.revokeAll();
		if (!magick.originalImageUrl) {
			this.entries = [];
			this.pointer = -1;
			return;
		}
		const blobUrl = await cloneBlobUrl(magick.originalImageUrl);
		const entry: HistoryEntry = {
			id: nextId++,
			label: 'Original',
			settings: snapSettings(magick.settings),
			blobUrl,
			width: magick.originalWidth,
			height: magick.originalHeight,
			format: magick.originalImageFormat ?? 'original',
			size: magick.originalImageSize,
			time: 0,
			ts: Date.now(),
			isOriginal: true,
			statsMessage: 'Original'
		};
		this.entries = [entry];
		this.pointer = 0;
	}

	/**
	 * Push a new state after a successful process. Clones the processed blob
	 * URL so history owns its own copy. Truncates any redo branch.
	 */
	async pushFromMagick(magick: MagickState, label: string): Promise<void> {
		if (!magick.processedImageUrl) return;
		const blobUrl = await cloneBlobUrl(magick.processedImageUrl);
		const entry: HistoryEntry = {
			id: nextId++,
			label,
			settings: snapSettings(magick.settings),
			blobUrl,
			width: magick.processedWidth,
			height: magick.processedHeight,
			format: magick.processedImageFormat ?? magick.settings.imageFormat.toLowerCase(),
			size: 0,
			time: 0,
			ts: Date.now(),
			isOriginal: false,
			statsMessage: magick.statsMessage
		};
		// Estimate size from the blob.
		try {
			const blob = await fetch(blobUrl).then((r) => r.blob());
			entry.size = blob.size;
		} catch {
			// ignore
		}
		entry.time = magick.processedImageTime;

		// Truncate redo branch.
		if (this.pointer < this.entries.length - 1) {
			const doomed = this.entries.slice(this.pointer + 1);
			for (const d of doomed) this._urlsToRevoke.add(d.blobUrl);
			this.entries = this.entries.slice(0, this.pointer + 1);
		}
		this.entries = [...this.entries, entry];

		// Enforce cap (evict oldest, but never the entry we just pushed).
		while (this.entries.length > MAX_ENTRIES) {
			const evicted = this.entries.shift()!;
			if (evicted.blobUrl !== entry.blobUrl) this._urlsToRevoke.add(evicted.blobUrl);
			this.pointer = Math.max(0, this.pointer - 1);
		}
		this.pointer = this.entries.length - 1;
		this.flushRevoke();
	}

	/** Restore state at `pointer - 1`. */
	async undo(magick: MagickState): Promise<void> {
		if (!this.canUndo) return;
		this.pointer -= 1;
		await this.restore(magick);
	}

	/** Restore state at `pointer + 1`. */
	async redo(magick: MagickState): Promise<void> {
		if (!this.canRedo) return;
		this.pointer += 1;
		await this.restore(magick);
	}

	/** Jump to an arbitrary entry by id. */
	async jumpTo(magick: MagickState, id: number): Promise<void> {
		const idx = this.entries.findIndex((e) => e.id === id);
		if (idx < 0) return;
		this.pointer = idx;
		await this.restore(magick);
	}

	private async restore(magick: MagickState): Promise<void> {
		const entry = this.current;
		if (!entry) return;
		magick.settings = snapSettings(entry.settings);
		// Give magick its own disposable URL (history keeps its own).
		if (magick.processedImageUrl) URL.revokeObjectURL(magick.processedImageUrl);
		if (entry.isOriginal) {
			magick.processedImageUrl = null;
			magick.processedImageFormat = null;
			magick.processedImageName = null;
			magick.processedWidth = 0;
			magick.processedHeight = 0;
		} else {
			magick.processedImageUrl = await cloneBlobUrl(entry.blobUrl);
			magick.processedImageFormat = entry.format;
			const base = magick.originalName.replace(/\.[^.]+$/, '');
			magick.processedImageName = `${base}-edited.${entry.format}`;
			magick.processedWidth = entry.width;
			magick.processedHeight = entry.height;
		}
		magick.statsMessage = entry.statsMessage;
		magick.hasError = false;
		magick.errorMessage = null;
	}

	clear(): void {
		this.revokeAll();
		this.entries = [];
		this.pointer = -1;
	}

	private revokeAll(): void {
		for (const e of this.entries) this._urlsToRevoke.add(e.blobUrl);
		this.flushRevoke();
	}

	private flushRevoke(): void {
		for (const url of this._urlsToRevoke) URL.revokeObjectURL(url);
		this._urlsToRevoke.clear();
	}
}

export function useHistory(): HistoryState {
	return new HistoryState();
}
