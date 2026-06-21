<script lang="ts">
	/**
	 * FileDropzone - the canvas empty-state card.
	 * Shows drop/paste/browse hints and a grid of sample images.
	 * Actual drop handling is global (in +page.svelte); this is the visual
	 * affordance plus a browse button and sample picker.
	 */

	import { UploadCloud, ImagePlus, ClipboardPaste } from 'lucide-svelte';
	import type { SampleImage } from '$lib/editor-types';

	let {
		onBrowse,
		onSelectSample,
		isDragging = false
	}: {
		onBrowse: () => void;
		onSelectSample: (s: SampleImage) => void;
		isDragging?: boolean;
	} = $props();

	const samples: SampleImage[] = [
		{ name: 'Circle Packing', url: '/samples/circle packing.png' },
		{ name: 'Geometric', url: '/samples/geometric.png' },
		{ name: 'Particle Burst', url: '/samples/particle burst.png' },
		{ name: 'Contour Bands', url: '/samples/contour bands.png' }
	];
</script>

<div
	class="flex w-full max-w-md flex-col items-center gap-6 rounded-lg p-8 text-center transition-all {isDragging
		? 'scale-[1.02] border-2 border-dashed border-primary bg-primary/5'
		: ''}"
>
	<div class="flex items-center justify-center text-muted-foreground">
		<UploadCloud class="size-12" />
	</div>

	<div class="space-y-1">
		<h2 class="text-lg font-semibold tracking-tight">Drop an image to begin</h2>
		<p class="text-sm text-muted-foreground">
			Drag &amp; drop anywhere, paste from clipboard, or browse.
		</p>
	</div>

	<div class="flex flex-wrap items-center justify-center gap-2">
		<button
			onclick={onBrowse}
			class="flex items-center gap-2 rounded-xs bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
		>
			<ImagePlus class="size-4" />
			Browse files
		</button>
		<span
			class="flex items-center gap-1.5 rounded-xs border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
		>
			<ClipboardPaste class="size-3.5" />
			Ctrl+V to paste
		</span>
	</div>

	<div class="w-full border-t border-dashed border-border/60 pt-5">
		<p class="mb-3 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
			Or try a sample
		</p>
		<div class="grid grid-cols-4 gap-2">
			{#each samples as s (s.url)}
				<button
					onclick={() => onSelectSample(s)}
					class="group relative aspect-square overflow-hidden rounded-xs border border-border/50 bg-muted transition-all hover:border-primary/50 hover:ring-2 hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					aria-label="Load sample: {s.name}"
				>
					<img
						src={s.url}
						alt={s.name}
						class="size-full object-cover transition-transform duration-200 group-hover:scale-102"
						draggable="false"
						loading="lazy"
					/>
					<span
						class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-left text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
					>
						{s.name}
					</span>
				</button>
			{/each}
		</div>
	</div>
</div>
