<script lang="ts">
	import { ZoomIn, ZoomOut, Maximize, Images, Columns2, Loader2 } from 'lucide-svelte';
	import FileDropzone from './FileDropzone.svelte';
	import SplitCompare from './SplitCompare.svelte';
	import type { SampleImage } from '$lib/editor-types';

	let {
		originalImageUrl = null,
		processedImageUrl = null,
		isLoading = false,
		wasmLoaded = true,
		currentProcessingStep = null,
		isDragging = false,
		onBrowse = () => {},
		onSelectSample = () => {},
		onStateChange = () => {}
	}: {
		originalImageUrl?: string | null;
		processedImageUrl?: string | null;
		isLoading?: boolean;
		wasmLoaded?: boolean;
		originalWidth?: number;
		originalHeight?: number;
		originalFormat?: string | null;
		processedWidth?: number;
		processedHeight?: number;
		processedFormat?: string | null;
		currentProcessingStep?: string | null;
		isDragging?: boolean;
		onBrowse?: () => void;
		onSelectSample?: (s: SampleImage) => void;
		onStateChange?: (s: { zoom: number; compareLabel: string | null }) => void;
	} = $props();

	let showPlaceholder = $derived(!originalImageUrl);
	let isInitializing = $derived(!wasmLoaded);
	let isComparing = $state(false);
	let splitMode = $state(false);

	// Zoom & Pan
	let currentZoom = $state(100);
	const zoomStep = 10;
	let isPanning = $state(false);
	let imageX = $state(0);
	let imageY = $state(0);
	let startPointerX = 0;
	let startPointerY = 0;
	let initialImageX = 0;
	let initialImageY = 0;

	let previewImageRef = $state<HTMLImageElement | null>(null);
	let viewportRef = $state<HTMLDivElement | null>(null);
	let loadedOriginalUrl: string | null | undefined = null;

	let imageStyle = $derived(`
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(calc(-50% + ${imageX}px), calc(-50% + ${imageY}px)) scale(${currentZoom / 100});
		display: ${showPlaceholder ? 'none' : 'block'};
		cursor: ${isPanning ? 'grabbing' : 'grab'};
		opacity: ${processedImageUrl || originalImageUrl ? 1 : 0};
	`);

	let displayedImage = $derived(
		isComparing ? originalImageUrl : processedImageUrl || originalImageUrl
	);

	let canSplit = $derived(
		!!processedImageUrl && !!originalImageUrl && processedImageUrl !== originalImageUrl
	);
	let compareLabel = $derived(splitMode ? 'Split compare' : isComparing ? 'Before' : null);

	// Report state (zoom + compare label) to parent for the status bar.
	$effect(() => {
		onStateChange({ zoom: currentZoom, compareLabel });
	});

	function setZoom(newZoom: number) {
		const roundedZoom = Math.floor(newZoom / 10) * 10;
		currentZoom = Math.max(10, Math.min(5000, roundedZoom));
	}

	export function fitImageToScreen() {
		if (isComparing) return;
		if (!previewImageRef || !viewportRef) return;
		const img = previewImageRef;
		const container = viewportRef;
		imageX = 0;
		imageY = 0;
		if (!img.naturalWidth || !img.naturalHeight) return;
		const padding = 12;
		const cw = container.clientWidth - padding;
		const ch = container.clientHeight - padding;
		const iw = img.naturalWidth;
		const ih = img.naturalHeight;
		const scale = Math.min(cw / iw, ch / ih);
		setZoom(scale * 100);
	}

	export function resetView() {
		fitImageToScreen();
	}
	export function zoomIn() {
		setZoom(currentZoom + zoomStep);
	}
	export function zoomOut() {
		setZoom(currentZoom - zoomStep);
	}
	export function toggleSplitCompare() {
		if (canSplit) splitMode = !splitMode;
	}
	export function getZoom() {
		return currentZoom;
	}

	function handleImageLoad() {
		if (isComparing) return;
		loadedOriginalUrl = processedImageUrl;
		fitImageToScreen();
	}

	// Re-fit when the processed image changes (history navigation can swap
	// the <img src> to a cached copy, in which case onload may not refire
	// and the previous fit would be stale for the new dimensions).
	// Only refit for the processed image — toggling between processed and
	// original for hold-to-compare must not reset zoom/pan.
	$effect(() => {
		const url = processedImageUrl;
		if (!url) return;
		if (loadedOriginalUrl === url) return;
		let frame = 0;
		const tryFit = () => {
			if (!previewImageRef) return;
			if (previewImageRef.naturalWidth > 0 && previewImageRef.naturalHeight > 0) {
				loadedOriginalUrl = url;
				fitImageToScreen();
				return;
			}
			frame = requestAnimationFrame(tryFit);
		};
		frame = requestAnimationFrame(tryFit);
		return () => cancelAnimationFrame(frame);
	});

	function handleResize() {
		if (!showPlaceholder) fitImageToScreen();
	}

	function onWheel(e: WheelEvent) {
		if (showPlaceholder) return;
		e.preventDefault();
		const oldZoom = currentZoom;
		let newZoom = oldZoom + (e.deltaY > 0 ? -zoomStep : zoomStep);
		newZoom = Math.max(10, Math.floor(newZoom / 10) * 10);
		if (newZoom === oldZoom) return;
		if (!viewportRef) return;
		const rect = viewportRef.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		const Px = e.clientX - cx;
		const Py = e.clientY - cy;
		const r = newZoom / oldZoom;
		imageX = Px * (1 - r) + imageX * r;
		imageY = Py * (1 - r) + imageY * r;
		currentZoom = newZoom;
	}

	function onPointerDown(e: PointerEvent) {
		if (showPlaceholder || e.button !== 0) return;
		isPanning = true;
		startPointerX = e.clientX;
		startPointerY = e.clientY;
		initialImageX = imageX;
		initialImageY = imageY;
	}

	function onPointerMove(e: PointerEvent) {
		if (!isPanning) return;
		imageX = initialImageX + (e.clientX - startPointerX);
		imageY = initialImageY + (e.clientY - startPointerY);
	}

	function onPointerUp() {
		isPanning = false;
	}

	let lastTouchDistance = $state<number | null>(null);

	function onTouchStart(e: TouchEvent) {
		if (showPlaceholder || e.touches.length !== 2) return;
		e.preventDefault();
		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		lastTouchDistance = Math.sqrt(dx * dx + dy * dy);
	}

	function onTouchMove(e: TouchEvent) {
		if (showPlaceholder || e.touches.length !== 2 || lastTouchDistance === null) return;
		e.preventDefault();
		const dx = e.touches[0].clientX - e.touches[1].clientX;
		const dy = e.touches[0].clientY - e.touches[1].clientY;
		const newDistance = Math.sqrt(dx * dx + dy * dy);
		const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
		const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
		const oldZoom = currentZoom;
		const scaleFactor = newDistance / lastTouchDistance;
		let newZoom = oldZoom * scaleFactor;
		newZoom = Math.max(10, Math.min(5000, Math.floor(newZoom / 10) * 10));
		if (newZoom !== oldZoom && viewportRef) {
			const rect = viewportRef.getBoundingClientRect();
			const Px = centerX - (rect.left + rect.width / 2);
			const Py = centerY - (rect.top + rect.height / 2);
			const r = newZoom / oldZoom;
			imageX = Px * (1 - r) + imageX * r;
			imageY = Py * (1 - r) + imageY * r;
			currentZoom = newZoom;
		}
		lastTouchDistance = newDistance;
	}

	function onTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2) lastTouchDistance = null;
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (showPlaceholder || !processedImageUrl) return;
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		if (e.code === 'Space') {
			e.preventDefault();
			if (!isComparing) isComparing = true;
		}
	}

	function handleKeyUp(e: KeyboardEvent) {
		if (e.code === 'Space') {
			e.preventDefault();
			isComparing = false;
		}
	}
</script>

<svelte:window onkeydown={handleKeyDown} onkeyup={handleKeyUp} onresize={handleResize} />

<main class="canvas-area relative flex h-full min-h-0 w-full flex-col bg-canvas">
	<div
		bind:this={viewportRef}
		role="img"
		aria-label="Image preview viewport. Use mouse wheel to zoom, drag to pan."
		onwheel={onWheel}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointerleave={onPointerUp}
		ontouchstart={onTouchStart}
		ontouchmove={onTouchMove}
		ontouchend={onTouchEnd}
		class="viewport relative flex h-full min-h-0 w-full flex-grow items-center justify-center overflow-hidden"
	>
		{#if isInitializing}
			<div class="text-center text-muted-foreground">
				<div class="mx-auto mb-4 flex size-16 items-center justify-center">
					<div class="relative">
						<div class="size-12 animate-pulse rounded-full border-4 border-muted"></div>
						<div
							class="absolute inset-0 size-12 animate-spin rounded-full border-4 border-t-primary"
						></div>
					</div>
				</div>
				<h3 class="mb-1 text-base font-semibold text-foreground">Initializing WASM Engine</h3>
				<p class="text-xs">Loading ImageMagick…</p>
			</div>
		{:else if showPlaceholder}
			<FileDropzone {isDragging} {onBrowse} {onSelectSample} />
		{:else if splitMode && canSplit}
			<SplitCompare
				originalUrl={originalImageUrl!}
				processedUrl={processedImageUrl!}
				{imageStyle}
				originalLabel="Original"
				processedLabel="Processed"
			/>
			<!-- keep a hidden img for fit-to-screen natural-size probing -->
			<img
				bind:this={previewImageRef}
				src={displayedImage ?? ''}
				onload={handleImageLoad}
				style="display:none"
				alt=""
				aria-hidden="true"
			/>
		{:else}
			<img
				bind:this={previewImageRef}
				src={displayedImage ?? ''}
				onload={handleImageLoad}
				style={imageStyle}
				alt={isComparing ? 'Original image before processing' : 'Processed image preview'}
				draggable="false"
				class="checkerboard max-h-none max-w-none origin-center object-contain transition-opacity duration-150 will-change-transform"
			/>
		{/if}

		<!-- Loading overlay -->
		{#if isLoading}
			<div
				class="absolute inset-0 z-40 flex items-center justify-center bg-background/30 backdrop-blur-sm"
			>
				<div class="flex flex-col items-center gap-3 rounded-lg border bg-background p-5 shadow-lg">
					<Loader2 class="size-8 animate-spin text-primary" />
					<span class="text-xs font-medium text-foreground">
						{currentProcessingStep ?? 'Processing…'}
					</span>
				</div>
			</div>
		{/if}
	</div>

	<!-- Floating zoom/compare toolbar -->
	{#if !showPlaceholder && !isInitializing}
		<div
			class="pointer-events-auto absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border bg-background/90 p-1 shadow-md backdrop-blur-sm"
		>
			<button
				onclick={zoomOut}
				class="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
				aria-label="Zoom out (Ctrl+-)"
			>
				<ZoomOut class="size-4" />
			</button>
			<span class="w-12 text-center font-mono text-[11px] font-medium text-foreground tabular-nums"
				>{currentZoom}%</span
			>
			<button
				onclick={zoomIn}
				class="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
				aria-label="Zoom in (Ctrl+=)"
			>
				<ZoomIn class="size-4" />
			</button>
			<button
				onclick={resetView}
				class="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
				aria-label="Fit to screen (Ctrl+0)"
			>
				<Maximize class="size-4" />
			</button>
			<div class="mx-0.5 h-4 w-px bg-border"></div>
			<button
				onpointerdown={(e) => {
					e.preventDefault();
					isComparing = true;
				}}
				onpointerup={(e) => {
					e.preventDefault();
					isComparing = false;
				}}
				onpointerleave={() => (isComparing = false)}
				disabled={!processedImageUrl}
				class="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40 {isComparing
					? 'bg-muted text-foreground'
					: ''}"
				aria-label="Hold to compare (Space)"
			>
				<Images class="size-4" />
			</button>
			<button
				onclick={toggleSplitCompare}
				disabled={!canSplit}
				class="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-40 {splitMode
					? 'bg-primary text-primary-foreground'
					: ''}"
				aria-label="Split compare (B)"
			>
				<Columns2 class="size-4" />
			</button>
		</div>
	{/if}
</main>
