<script lang="ts">
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Palette, RefreshCcw } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';

	let { magick } = $props<{ magick: MagickState }>();
</script>

<AccordionItem value="color" class="border-b px-4">
	<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
		<div class="flex w-full flex-1 items-center justify-between gap-2.5 pr-2">
			<div class="flex items-center gap-2.5">
				<Palette class="h-4 w-4 text-primary" />
				<span class="text-xs font-bold tracking-wider uppercase">Color</span>
				{#if magick.settings.normalizeImage || magick.settings.autoLevel || magick.settings.autoOrient || magick.settings.brightness[0] !== 100 || magick.settings.contrast[0] !== 0 || magick.settings.saturation[0] !== 100 || magick.settings.hue[0] !== 100 || magick.settings.levelBlackpoint[0] !== 0 || magick.settings.levelWhitepoint[0] !== 100 || magick.settings.levelGamma[0] !== 1.0 || magick.settings.levelChannels !== 'All' || magick.settings.thresholdPercentage[0] !== 50 || magick.settings.thresholdChannels !== 'All' || magick.settings.sigmoidalContrast[0] !== 0 || magick.settings.sigmoidalMidpoint[0] !== 50 || magick.settings.sigmoidalChannels !== 'All' || magick.settings.colorSpace !== 'RGB'}
					<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
				{/if}
			</div>
			<Button
				onclick={(e) => {
					e.stopPropagation();
					magick.resetColor();
				}}
				variant="ghost"
				size="icon"
				class="h-6 w-6 opacity-0 transition-opacity duration-50 group-hover:opacity-100"
			>
				<RefreshCcw class="h-3 w-3 text-muted-foreground" />
			</Button>
		</div>
	</AccordionTrigger>
	<AccordionContent class="space-y-5 pb-4">
		<div class="space-y-4">
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Brightness</Label
					>
					<span class="font-mono text-[11px] font-bold">{magick.settings.brightness[0]}%</span>
				</div>
				<Slider
					type="multiple"
					bind:value={magick.settings.brightness}
					min={0}
					max={200}
					step={1}
				/>
			</div>
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Contrast</Label
					>
					<span class="font-mono text-[11px] font-bold">{magick.settings.contrast[0]}</span>
				</div>
				<Slider
					type="multiple"
					bind:value={magick.settings.contrast}
					min={-100}
					max={100}
					step={1}
				/>
			</div>
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Saturation</Label
					>
					<span class="font-mono text-[11px] font-bold">{magick.settings.saturation[0]}%</span>
				</div>
				<Slider
					type="multiple"
					bind:value={magick.settings.saturation}
					min={0}
					max={300}
					step={1}
				/>
			</div>
			<div class="space-y-1.5">
				<div class="flex items-center justify-between">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Hue</Label
					>
					<span class="font-mono text-[11px] font-bold">{magick.settings.hue[0]}%</span>
				</div>
				<Slider type="multiple" bind:value={magick.settings.hue} min={0} max={200} step={1} />
			</div>
		</div>

		<div class="space-y-3 border-t border-dashed border-border/60 pt-3">
			<div class="grid grid-cols-2 gap-2">
				<div class="space-y-2">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Color Space</Label
					>
					<Select type="single" bind:value={magick.settings.colorSpace}>
						<SelectTrigger class="h-9 text-xs">
							{(magick.settings.colorSpace as string) || 'RGB'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="RGB">RGB</SelectItem>
							<SelectItem value="Gray">Grayscale</SelectItem>
							<SelectItem value="CMYK">CMYK</SelectItem>
							<SelectItem value="HSL">HSL</SelectItem>
							<SelectItem value="HSV">HSV</SelectItem>
							<SelectItem value="LAB">LAB</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div class="grid grid-cols-1 gap-2">
					<div class="flex items-end">
						<label
							for="normalize"
							class="flex h-9 w-full cursor-pointer items-center justify-between rounded-xs border border-border/50 bg-muted/40 px-2.5 transition-colors duration-50 hover:bg-muted/60"
						>
							<span class="text-[11px] font-medium">Normalize</span>
							<Switch
								id="normalize"
								bind:checked={magick.settings.normalizeImage}
								class="pointer-events-none scale-75"
							/>
						</label>
					</div>
				</div>
			</div>

			<label
				for="autoLevel"
				class="flex cursor-pointer items-center justify-between rounded-xs border border-border/50 bg-muted/40 px-2.5 py-2 transition-colors duration-50 hover:bg-muted/60"
			>
				<span class="text-[11px] font-medium">Auto Level</span>
				<Switch
					id="autoLevel"
					bind:checked={magick.settings.autoLevel}
					class="pointer-events-none scale-75"
				/>
			</label>
		</div>

		<div class="space-y-3 border-t border-dashed border-border/60 pt-3">
			<div class="flex items-center justify-between">
				<Label
					class="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>
					Levels
				</Label>
				<Select type="single" bind:value={magick.settings.levelChannels}>
					<SelectTrigger class="h-7 w-20 border-muted-foreground/30 px-2 text-[11px]">
						{(magick.settings.levelChannels as string) || 'All'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="All">All</SelectItem>
						<SelectItem value="Red">Red</SelectItem>
						<SelectItem value="Green">Green</SelectItem>
						<SelectItem value="Blue">Blue</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div class="space-y-3">
				<div class="space-y-1.5">
					<div class="flex justify-between">
						<span class="text-[11px] text-muted-foreground">Black Point</span>
						<span class="font-mono text-[11px] font-bold">{magick.settings.levelBlackpoint[0]}</span
						>
					</div>
					<Slider
						type="multiple"
						bind:value={magick.settings.levelBlackpoint}
						max={100}
						min={0}
						step={1}
					/>
				</div>
				<div class="space-y-1.5">
					<div class="flex justify-between">
						<span class="text-[11px] text-muted-foreground">White Point</span>
						<span class="font-mono text-[11px] font-bold">{magick.settings.levelWhitepoint[0]}</span
						>
					</div>
					<Slider
						type="multiple"
						bind:value={magick.settings.levelWhitepoint}
						max={100}
						min={0}
						step={1}
					/>
				</div>
				<div class="space-y-1.5">
					<div class="flex justify-between">
						<span class="text-[11px] text-muted-foreground">Gamma</span>
						<span class="font-mono text-[11px] font-bold"
							>{magick.settings.levelGamma[0].toFixed(1)}</span
						>
					</div>
					<Slider
						type="multiple"
						bind:value={magick.settings.levelGamma}
						max={3}
						min={0.1}
						step={0.1}
					/>
				</div>
			</div>
		</div>

		<Accordion type="single" class="w-full border-t border-dashed border-border/60">
			<AccordionItem value="adv" class="border-0">
				<AccordionTrigger
					class="py-2.5 text-[11px] tracking-wider text-muted-foreground uppercase transition-colors duration-50 hover:text-foreground hover:no-underline"
					>Advanced Color</AccordionTrigger
				>
				<AccordionContent class="space-y-3 pt-2">
					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="text-[11px] text-muted-foreground">Threshold</span>
							<span class="font-mono text-[11px] font-bold"
								>{magick.settings.thresholdPercentage[0]}%</span
							>
						</div>
						<Slider
							type="multiple"
							bind:value={magick.settings.thresholdPercentage}
							max={100}
							min={0}
							step={1}
						/>
					</div>
					<div class="space-y-1.5">
						<div class="flex items-center justify-between">
							<span class="text-[11px] text-muted-foreground">Sigmoidal Contrast</span>
							<span class="font-mono text-[11px] font-bold"
								>{magick.settings.sigmoidalContrast[0]}</span
							>
						</div>
						<Slider
							type="multiple"
							bind:value={magick.settings.sigmoidalContrast}
							max={20}
							min={-20}
							step={1}
						/>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	</AccordionContent>
</AccordionItem>
