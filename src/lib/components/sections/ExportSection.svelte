<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import type { MagickState } from '$lib/useMagick.svelte';
	import ToggleRow from '$lib/components/controls/ToggleRow.svelte';
	let { magick } = $props<{ magick: MagickState }>();

	const LOSSLESS = new Set(['PNG', 'GIF']);
	let isLossless = $derived(LOSSLESS.has(magick.settings.imageFormat));
</script>

<div class="space-y-5">
	<div class="grid grid-cols-2 gap-3">
		<div class="space-y-2">
			<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>Format</span
			>
			<select bind:value={magick.settings.imageFormat} class="w-full h-9 text-xs font-mono bg-transparent outline-none">
				{#each ['WebP', 'JPEG', 'PNG', 'AVIF', 'JXL', 'TIFF', 'GIF'] as fmt}
					<option value={fmt}>{fmt}</option>
				{/each}
			</select>
		</div>
		<div class="space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
					>Quality</span
				>
				<span class="font-mono text-xs font-semibold text-foreground tabular-nums">
					{#if isLossless}
						<span class="text-muted-foreground">Lossless</span>
					{:else}
						{magick.settings.quality[0]}%
					{/if}
				</span>
			</div>
			<div class="relative flex items-center h-4 py-2">
				<div class="absolute inset-x-0 h-px border-b border-foreground/50 pointer-events-none"></div>
				<input
					type="range"
					min={1}
					max={100}
					step={1}
					bind:value={magick.settings.quality[0]}
					disabled={isLossless}
					class="w-full appearance-none bg-transparent m-0 p-0 h-4 cursor-pointer focus:outline-none slider-raw disabled:opacity-50 disabled:cursor-not-allowed"
				/>
			</div>
		</div>
	</div>

	<ToggleRow
		id="exp-strip-meta"
		label="Strip Metadata"
		description="Remove EXIF / profiles"
		bind:checked={magick.settings.stripMeta}
	/>

	<!-- Output preview -->
	{#if magick.processedImageUrl}
		<div class="border border-foreground/30 bg-transparent p-3">
			<div class="mb-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
				Output
			</div>
			<div class="space-y-1 font-mono text-xs">
				<div class="flex justify-between">
					<span class="text-muted-foreground">Dimensions</span>
					<span class="text-foreground">{magick.processedWidth}×{magick.processedHeight}</span>
				</div>
				<div class="flex justify-between">
					<span class="text-muted-foreground">Format</span>
					<span class="text-foreground uppercase">{magick.processedImageFormat}</span>
				</div>
				{#if magick.statsMessage}
					<div class="flex justify-between">
						<span class="text-muted-foreground">Process time</span>
						<span class="text-foreground">{magick.processedImageTime}ms</span>
					</div>
					<div class="flex justify-between">
						<span class="text-muted-foreground">File size</span>
						<span class="text-foreground">{magick.processedImageDelta}</span>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
