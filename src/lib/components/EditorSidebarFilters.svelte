<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import {
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { RefreshCcw, Wand2 } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';

	let { magick } = $props<{ magick: MagickState }>();
</script>

<AccordionItem value="filters" class="border-b px-4">
	<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
		<div class="flex w-full flex-1 items-center justify-between gap-2.5 pr-2">
			<div class="flex items-center gap-2.5">
				<Wand2 class="h-4 w-4 text-primary" />
				<span class="text-xs font-bold tracking-wider uppercase">Filters</span>
				{#if magick.settings.effect !== 'none' || magick.settings.blur[0] > 0 || magick.settings.sharpen[0] > 0 || magick.settings.sepiaThreshold[0] !== 80 || magick.settings.charcoalIntensity[0] > 0 || magick.settings.cannyEdgeStrength[0] > 0 || magick.settings.cannyEdgeLower[0] !== 10 || magick.settings.cannyEdgeUpper[0] !== 30 || magick.settings.oilpaintRadius[0] > 0 || magick.settings.solarizeFactor[0] !== 50 || magick.settings.bilateralWidth[0] > 0 || magick.settings.bilateralHeight[0] > 0 || magick.settings.bilateralIntensitySigma[0] !== 1.5 || magick.settings.bilateralSpatialSigma[0] !== 1}
					<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
				{/if}
			</div>
			<Button
				onclick={(e) => {
					e.stopPropagation();
					magick.resetFilters();
				}}
				variant="ghost"
				size="icon"
				class="h-6 w-6 opacity-0 transition-opacity duration-50 group-hover:opacity-100"
			>
				<RefreshCcw class="h-3 w-3 text-muted-foreground" />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="space-y-4 pb-4">
		<div class="space-y-2">
			<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>Effect Preset</Label
			>
			<Select type="single" bind:value={magick.settings.effect}>
				<SelectTrigger class="h-9">
					{#if magick.settings.effect === 'none'}
						None (Original)
					{:else if magick.settings.effect === 'grayscale'}
						Grayscale
					{:else if magick.settings.effect === 'sepia'}
						Sepia Tone
					{:else if magick.settings.effect === 'charcoal'}
						Charcoal Sketch
					{:else if magick.settings.effect === 'negate'}
						Negative
					{:else if magick.settings.effect === 'cannyEdge'}
						Edge Detection
					{:else if magick.settings.effect === 'oilpaint'}
						Oil Paint
					{:else if magick.settings.effect === 'solarize'}
						Solarize
					{:else if magick.settings.effect === 'bilateralBlur'}
						Bilateral Blur
					{:else}
						{magick.settings.effect as string}
					{/if}
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="none">None (Original)</SelectItem>
					<SelectItem value="grayscale">Grayscale</SelectItem>
					<SelectItem value="sepia">Sepia Tone</SelectItem>
					<SelectItem value="charcoal">Charcoal Sketch</SelectItem>
					<SelectItem value="negate">Negative</SelectItem>
					<SelectItem value="cannyEdge">Edge Detection</SelectItem>
					<SelectItem value="oilpaint">Oil Paint</SelectItem>
					<SelectItem value="solarize">Solarize</SelectItem>
					<SelectItem value="bilateralBlur">Bilateral Blur</SelectItem>
				</SelectContent>
			</Select>
		</div>

		{#if magick.settings.effect !== 'none'}
			<div
				class="animate-in space-y-3 rounded-sm border border-border bg-muted/30 p-3 duration-50 fade-in slide-in-from-top-2"
			>
				{#if magick.settings.effect === 'sepia'}
					<div class="space-y-1.5">
						<div class="flex justify-between">
							<span class="text-[11px] font-medium text-muted-foreground">Threshold</span>
							<span class="font-mono text-[11px] font-bold"
								>{magick.settings.sepiaThreshold[0]}%</span
							>
						</div>
						<Slider
							type="multiple"
							bind:value={magick.settings.sepiaThreshold}
							max={100}
							min={0}
							step={1}
						/>
					</div>
				{/if}

				{#if magick.settings.effect === 'charcoal'}
					<div class="space-y-1.5">
						<div class="flex justify-between">
							<span class="text-[11px] font-medium text-muted-foreground">Intensity</span>
							<span class="font-mono text-[11px] font-bold"
								>{magick.settings.charcoalIntensity[0]}</span
							>
						</div>
						<Slider
							type="multiple"
							bind:value={magick.settings.charcoalIntensity}
							max={10}
							min={0}
							step={0.5}
						/>
					</div>
				{/if}

				{#if magick.settings.effect === 'oilpaint'}
					<div class="space-y-1.5">
						<div class="flex justify-between">
							<span class="text-[11px] font-medium text-muted-foreground">Radius</span>
							<span class="font-mono text-[11px] font-bold"
								>{magick.settings.oilpaintRadius[0]}</span
							>
						</div>
						<Slider
							type="multiple"
							bind:value={magick.settings.oilpaintRadius}
							max={15}
							min={0}
							step={0.5}
						/>
					</div>
				{/if}

				{#if magick.settings.effect === 'solarize'}
					<div class="space-y-1.5">
						<div class="flex justify-between">
							<span class="text-[11px] font-medium text-muted-foreground">Factor</span>
							<span class="font-mono text-[11px] font-bold"
								>{magick.settings.solarizeFactor[0]}%</span
							>
						</div>
						<Slider
							type="multiple"
							bind:value={magick.settings.solarizeFactor}
							max={100}
							min={0}
							step={1}
						/>
					</div>
				{/if}

				{#if magick.settings.effect === 'cannyEdge'}
					<div class="space-y-3">
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<span class="text-[11px] font-medium text-muted-foreground">Strength</span>
								<span class="font-mono text-[11px] font-bold"
									>{magick.settings.cannyEdgeStrength[0]}</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.cannyEdgeStrength}
								max={10}
								min={0}
								step={0.1}
							/>
						</div>
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<span class="text-[11px] font-medium text-muted-foreground">Lower Threshold</span>
								<span class="font-mono text-[11px] font-bold"
									>{magick.settings.cannyEdgeLower[0]}%</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.cannyEdgeLower}
								max={100}
								min={0}
								step={1}
							/>
						</div>
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<span class="text-[11px] font-medium text-muted-foreground">Upper Threshold</span>
								<span class="font-mono text-[11px] font-bold"
									>{magick.settings.cannyEdgeUpper[0]}%</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.cannyEdgeUpper}
								max={100}
								min={0}
								step={1}
							/>
						</div>
					</div>
				{/if}

				{#if magick.settings.effect === 'bilateralBlur'}
					<div class="space-y-3">
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<span class="text-[11px] font-medium text-muted-foreground">Width</span>
								<span class="font-mono text-[11px] font-bold"
									>{magick.settings.bilateralWidth[0]}</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.bilateralWidth}
								max={20}
								min={0}
								step={1}
							/>
						</div>
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<span class="text-[11px] font-medium text-muted-foreground">Height</span>
								<span class="font-mono text-[11px] font-bold"
									>{magick.settings.bilateralHeight[0]}</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.bilateralHeight}
								max={20}
								min={0}
								step={1}
							/>
						</div>
					</div>
				{/if}

				{#if ['grayscale', 'negate'].includes(magick.settings.effect as string)}
					<div class="py-1 text-center text-[11px] text-muted-foreground">
						No additional parameters for this effect
					</div>
				{/if}
			</div>
		{/if}

		<div class="grid grid-cols-2 gap-3 border-t border-dashed border-border/60 pt-3">
			<div class="space-y-1.5">
				<div class="flex justify-between">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Blur</Label
					>
					<span class="font-mono text-[11px] font-bold">{magick.settings.blur[0]}</span>
				</div>
				<Slider type="multiple" bind:value={magick.settings.blur} max={20} min={0} step={0.5} />
			</div>
			<div class="space-y-1.5">
				<div class="flex justify-between">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Sharpen</Label
					>
					<span class="font-mono text-[11px] font-bold">{magick.settings.sharpen[0]}</span>
				</div>
				<Slider type="multiple" bind:value={magick.settings.sharpen} max={10} min={0} step={0.5} />
			</div>
		</div>
	</AccordionContent>
</AccordionItem>
