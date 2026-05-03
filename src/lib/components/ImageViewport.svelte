<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip/index.js';
	import { ZoomIn, ZoomOut, Maximize, Images, Image as ImageIcon } from 'lucide-svelte';

	let {
		originalImageUrl = null,
		processedImageUrl = null,
		isLoading = false,
		wasmLoaded = true,
		originalWidth = 0,
		originalHeight = 0,
		originalFormat = null,
		processedWidth = 0,
		processedHeight = 0,
		processedFormat = null,
		currentProcessingStep = null
	} = $props<{
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
	}>();

	let showPlaceholder = $derived(!originalImageUrl);
	let isInitializing = $derived(!wasmLoaded);
	let isComparing = $state(false);

	// Zoom & Pan State
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

	// Keep track of the initially loaded original image to only fit-to-screen on newly uploaded files
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

	function setZoom(newZoom: number) {
		const roundedZoom = Math.floor(newZoom / 10) * 10;
		currentZoom = Math.max(1, Math.min(5000, roundedZoom));
	}

	export function fitImageToScreen() {
		if (isComparing) return;
		if (!previewImageRef || !viewportRef) return;
		const img = previewImageRef;
		const container = viewportRef;
		imageX = 0;
		imageY = 0;
		if (!img.naturalWidth || !img.naturalHeight) return;
		const padding = 10;
		const cw = container.clientWidth - padding;
		const ch = container.clientHeight - padding;
		const iw = img.naturalWidth;
		const ih = img.naturalHeight;
		const scale = Math.min(cw / iw, ch / ih);
		let targetZoom = scale * 100;
		setZoom(targetZoom);
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

	function handleImageLoad() {
		if (loadedOriginalUrl !== originalImageUrl) {
			loadedOriginalUrl = originalImageUrl;
			fitImageToScreen();
		}
	}

	function handleResize() {
		if (!showPlaceholder) fitImageToScreen();
	}

	function onWheel(e: WheelEvent) {
		if (showPlaceholder) return;
		e.preventDefault();
		const oldZoom = currentZoom;
		let newZoom = oldZoom + (e.deltaY > 0 ? -zoomStep : zoomStep);
		newZoom = Math.max(1, Math.floor(newZoom / 10) * 10);
		if (newZoom === oldZoom) return;
		if (!viewportRef) return;
		const viewportRect = viewportRef.getBoundingClientRect();
		const viewportCenterX = viewportRect.left + viewportRect.width / 2;
		const viewportCenterY = viewportRect.top + viewportRect.height / 2;
		const Px = e.clientX - viewportCenterX;
		const Py = e.clientY - viewportCenterY;
		const r = newZoom / oldZoom;
		const newImageX = Px * (1 - r) + imageX * r;
		const newImageY = Py * (1 - r) + imageY * r;
		currentZoom = newZoom;
		imageX = newImageX;
		imageY = newImageY;
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

	// Touch support for pinch-to-zoom
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
		newZoom = Math.max(1, Math.min(5000, Math.floor(newZoom / 10) * 10));
		if (newZoom !== oldZoom && viewportRef) {
			const viewportRect = viewportRef.getBoundingClientRect();
			const Px = centerX - (viewportRect.left + viewportRect.width / 2);
			const Py = centerY - (viewportRect.top + viewportRect.height / 2);
			const r = newZoom / oldZoom;
			imageX = Px * (1 - r) + imageX * r;
			imageY = Py * (1 - r) + imageY * r;
			currentZoom = newZoom;
		}
		lastTouchDistance = newDistance;
	}

	function onTouchEnd(e: TouchEvent) {
		if (e.touches.length < 2) {
			lastTouchDistance = null;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (showPlaceholder || !processedImageUrl) return;
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
		if (e.code === 'Space') {
			e.preventDefault();
			if (isComparing) return;
			isComparing = true;
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

<main class="canvas-area relative flex h-full min-h-0 w-full flex-col bg-zinc-200 dark:bg-zinc-900">
	<div
		class="toolbar relative z-10 flex h-14 w-full flex-none items-center justify-between border-b bg-background p-4"
	>
		<TooltipProvider>
			<div class="tool-group flex items-center gap-2">
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={zoomOut}
							variant="outline"
							size="icon"
							disabled={showPlaceholder}
							class="h-8 w-8 cursor-pointer"
						>
							<ZoomOut class="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Zoom Out (Ctrl+-)</p></TooltipContent>
				</Tooltip>

				<span class="zoom-level w-12 text-center text-sm font-medium text-foreground"
					>{currentZoom}%</span
				>

				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={zoomIn}
							variant="outline"
							size="icon"
							disabled={showPlaceholder}
							class="h-8 w-8 cursor-pointer"
						>
							<ZoomIn class="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Zoom In (Ctrl+=)</p></TooltipContent>
				</Tooltip>

				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={resetView}
							variant="outline"
							size="icon"
							disabled={showPlaceholder}
							class="h-8 w-8 cursor-pointer"
						>
							<Maximize class="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Reset View (Ctrl+0)</p></TooltipContent>
				</Tooltip>
			</div>

			<div class="tool-group">
				<Tooltip>
					<TooltipTrigger>
						<Button
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
							variant={isComparing ? 'default' : 'outline'}
							class="h-8 cursor-pointer"
						>
							<Images class="mr-2 h-4 w-4" />
							Compare
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Hold to Compare (Space)</p></TooltipContent>
				</Tooltip>
			</div>
		</TooltipProvider>
	</div>

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
		class="viewport relative flex h-full min-h-0 w-full flex-grow flex-col items-center justify-center overflow-hidden bg-zinc-100 dark:bg-zinc-950"
	>
		{#if isInitializing}
			<div class="text-center text-muted-foreground">
				<div class="icon-lg mx-auto mb-4 flex h-16 w-16 items-center justify-center">
					<div class="relative">
						<div class="h-12 w-12 animate-pulse rounded-full border-4 border-muted"></div>
						<div
							class="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-t-primary"
						></div>
					</div>
				</div>
				<h3 class="mb-2 text-xl font-semibold text-foreground">Initializing WASM Engine</h3>
				<p class="text-sm">Loading ImageMagick...</p>
			</div>
		{:else if showPlaceholder}
			<div class="placeholder-state text-center text-muted-foreground">
				<ImageIcon class="icon-lg mx-auto mb-4 h-16 w-16" />
				<h3 class="mb-2 text-xl font-semibold">No Image Loaded</h3>
				<p class="text-sm">Import an image from the sidebar to begin.</p>
			</div>
		{/if}

		{#if displayedImage && !showPlaceholder}
			<img
				bind:this={previewImageRef}
				src={displayedImage}
				onload={handleImageLoad}
				style={imageStyle}
				alt={isComparing ? 'Original image before processing' : 'Processed image preview'}
				draggable="false"
				class="checkerboard max-h-none max-w-none origin-center object-contain transition-opacity duration-200 ease-out will-change-transform"
			/>
		{/if}

		{#if isComparing}
			<div
				class="absolute top-4 left-4 z-20 rounded-md border bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm"
			>
				Before · {originalWidth}×{originalHeight} · {originalFormat?.toUpperCase() || ''}
			</div>
		{:else if processedImageUrl}
			<div
				class="absolute top-4 left-4 z-20 rounded-md border bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow-lg backdrop-blur-sm"
			>
				After · {processedWidth}×{processedHeight} · {processedFormat?.toUpperCase() || ''}
			</div>
		{/if}

		{#if isLoading}
			<div
				class="loading-overlay absolute inset-0 z-10 flex items-center justify-center bg-background/25 backdrop-blur-sm"
			>
				<div
					class="loading-content flex flex-col items-center gap-3 rounded-xl border bg-background p-6 shadow-lg"
				>
					<div class="relative">
						<div class="h-12 w-12 animate-pulse rounded-full border-4 border-muted"></div>
						<div
							class="absolute inset-0 h-12 w-12 animate-spin rounded-full border-4 border-t-primary"
						></div>
					</div>
					<span class="text-sm font-medium text-foreground"
						>Processing{currentProcessingStep ? `: ${currentProcessingStep}` : '...'}</span
					>
				</div>
			</div>
		{/if}
	</div>
</main>
