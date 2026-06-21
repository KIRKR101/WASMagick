<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import type { MagickState } from '$lib/useMagick.svelte';
	import SliderRow from '$lib/components/controls/SliderRow.svelte';
	import SectionCard from '$lib/components/controls/SectionCard.svelte';

	let { magick } = $props<{ magick: MagickState }>();

	const EFFECT_LABELS: Record<string, string> = {
		none: 'None (Original)',
		grayscale: 'Grayscale',
		sepia: 'Sepia Tone',
		charcoal: 'Charcoal Sketch',
		negate: 'Negative',
		cannyEdge: 'Edge Detection',
		oilpaint: 'Oil Paint',
		solarize: 'Solarize',
		bilateralBlur: 'Bilateral Blur'
	};
</script>

<div class="space-y-5">
	<!-- Effect preset -->
	<div class="space-y-2">
		<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>Effect Preset</span
		>
		<Select type="single" bind:value={magick.settings.effect}>
			<SelectTrigger class="h-9">
				{EFFECT_LABELS[magick.settings.effect as string] ?? (magick.settings.effect as string)}
			</SelectTrigger>
			<SelectContent>
				{#each Object.entries(EFFECT_LABELS) as [value, label]}
					<SelectItem {value}>{label}</SelectItem>
				{/each}
			</SelectContent>
		</Select>
	</div>

	{#if magick.settings.effect !== 'none'}
		<SectionCard>
			<div class="space-y-3">
				{#if magick.settings.effect === 'sepia'}
					<SliderRow
						label="Threshold"
						bind:value={magick.settings.sepiaThreshold}
						suffix="%"
						min={0}
						max={100}
					/>
				{:else if magick.settings.effect === 'charcoal'}
					<SliderRow
						label="Intensity"
						bind:value={magick.settings.charcoalIntensity}
						min={0}
						max={10}
						step={0.5}
					/>
				{:else if magick.settings.effect === 'oilpaint'}
					<SliderRow
						label="Radius"
						bind:value={magick.settings.oilpaintRadius}
						min={0}
						max={15}
						step={0.5}
					/>
				{:else if magick.settings.effect === 'solarize'}
					<SliderRow
						label="Factor"
						bind:value={magick.settings.solarizeFactor}
						suffix="%"
						min={0}
						max={100}
					/>
				{:else if magick.settings.effect === 'cannyEdge'}
					<SliderRow
						label="Strength"
						bind:value={magick.settings.cannyEdgeStrength}
						min={0}
						max={10}
						step={0.1}
					/>
					<SliderRow
						label="Lower Threshold"
						bind:value={magick.settings.cannyEdgeLower}
						suffix="%"
						min={0}
						max={100}
					/>
					<SliderRow
						label="Upper Threshold"
						bind:value={magick.settings.cannyEdgeUpper}
						suffix="%"
						min={0}
						max={100}
					/>
				{:else if magick.settings.effect === 'bilateralBlur'}
					<SliderRow label="Width" bind:value={magick.settings.bilateralWidth} min={0} max={20} />
					<SliderRow label="Height" bind:value={magick.settings.bilateralHeight} min={0} max={20} />
				{:else if ['grayscale', 'negate'].includes(magick.settings.effect as string)}
					<p class="py-1 text-center text-[11px] text-muted-foreground">
						No additional parameters for this effect
					</p>
				{/if}
			</div>
		</SectionCard>
	{/if}

	<!-- Blur + Sharpen -->
	<div class="grid grid-cols-2 gap-3 border-t border-dashed border-border/60 pt-4">
		<SliderRow label="Blur" bind:value={magick.settings.blur} min={0} max={20} step={0.5} />
		<SliderRow label="Sharpen" bind:value={magick.settings.sharpen} min={0} max={10} step={0.5} />
	</div>
</div>
