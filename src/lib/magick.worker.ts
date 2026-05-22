import { initializeImageMagick } from '@imagemagick/magick-wasm';
import { processImageSync, type ProcessResult } from './magick-process';
import type { MagickSettings } from './types';

let ready = false;
let initPromise: Promise<void> | null = null;

async function ensureReady() {
	if (ready) return;
	if (!initPromise) {
		initPromise = fetch('/magick.wasm', { cache: 'force-cache' })
			.then((r) => {
				if (!r.ok) throw new Error(`Failed to fetch WASM: ${r.status}`);
				return r.arrayBuffer();
			})
			.then((buf) => initializeImageMagick(new Uint8Array(buf)))
			.then(() => {
				ready = true;
			});
	}
	return initPromise;
}

interface WorkerRequest {
	id: number;
	sourceBytes: Uint8Array;
	settings: MagickSettings;
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
	const { id, sourceBytes, settings } = e.data;

	try {
		await ensureReady();
		const result: ProcessResult = processImageSync(sourceBytes, settings);
		self.postMessage({ id, result });
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		self.postMessage({ id, error: message });
	}
};
