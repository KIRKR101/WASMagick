<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
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
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion/index.js';
	import { Maximize, RefreshCcw } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';

	let { magick } = $props<{ magick: MagickState }>();
</script>

<AccordionItem value="geometry" class="border-b px-4">
	<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
		<div class="flex w-full flex-1 items-center justify-between gap-2.5 pr-2">
			<div class="flex items-center gap-2.5">
				<Maximize class="h-4 w-4 text-primary" />
				<span class="text-xs font-bold tracking-wider uppercase">Geometry</span>
				{#if magick.settings.resizeW || magick.settings.resizeH || magick.settings.rotate !== '0' || magick.settings.flip || magick.settings.flop || magick.settings.borderSize[0] > 0 || magick.settings.extentW || magick.settings.extentH || magick.settings.deskewThreshold[0] > 0}
					<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
				{/if}
			</div>
			<Button
				onclick={(e) => {
					e.stopPropagation();
					magick.resetGeometry();
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
		<div class="space-y-2">
			<Label
				class="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Resize (pixels)
			</Label>
			<div class="grid grid-cols-2 gap-2">
				<div class="relative">
					<span
						class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
						>W</span
					>
					<Input
						type="number"
						bind:value={magick.settings.resizeW}
						placeholder="Auto"
						min="0"
						class="h-9 pl-8 font-mono text-xs"
					/>
				</div>
				<div class="relative">
					<span
						class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
						>H</span
					>
					<Input
						type="number"
						bind:value={magick.settings.resizeH}
						placeholder="Auto"
						min="0"
						class="h-9 pl-8 font-mono text-xs"
					/>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-2">
				<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
					>Rotate</Label
				>
				<Select type="single" bind:value={magick.settings.rotate}>
					<SelectTrigger class="h-9 text-xs">
						{#if magick.settings.rotate === '0'}
							0° (None)
						{:else}
							{magick.settings.rotate}°
						{/if}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="0">0° (None)</SelectItem>
						<SelectItem value="90">90° CW</SelectItem>
						<SelectItem value="180">180°</SelectItem>
						<SelectItem value="-90">270° CCW</SelectItem>
					</SelectContent>
				</Select>
			</div>
			<div class="space-y-2">
				<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
					>Transform</Label
				>
				<div class="grid h-9 grid-cols-2 gap-1.5">
					<label
						for="flip"
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-border/50 bg-muted/40 px-2 transition-colors duration-50 hover:bg-muted/60"
					>
						<Switch id="flip" bind:checked={magick.settings.flip} class="pointer-events-none" />
						<span class="text-[11px] font-semibold">Flip</span>
					</label>
					<label
						for="flop"
						class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-border/50 bg-muted/40 px-2 transition-colors duration-50 hover:bg-muted/60"
					>
						<Switch id="flop" bind:checked={magick.settings.flop} class="pointer-events-none" />
						<span class="text-[11px] font-semibold">Flop</span>
					</label>
				</div>
			</div>
		</div>

		<label
			for="autoOrient"
			class="flex cursor-pointer items-center justify-between rounded-sm border border-border/50 bg-muted/40 p-3 transition-colors duration-50 hover:bg-muted/60"
		>
			<span class="text-[11px] font-medium">Auto Orient (from EXIF)</span>
			<Switch
				id="autoOrient"
				bind:checked={magick.settings.autoOrient}
				class="pointer-events-none"
			/>
		</label>

		<div class="space-y-2 rounded-sm border border-border/40 bg-muted/20 p-3">
			<div class="flex items-center justify-between">
				<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
					>Deskew</span
				>
				<label for="deskewAutoCrop" class="flex cursor-pointer items-center gap-2">
					<span class="text-[11px] text-muted-foreground">Auto Crop</span>
					<Switch
						id="deskewAutoCrop"
						bind:checked={magick.settings.deskewAutoCrop}
						class="pointer-events-none scale-75"
					/>
				</label>
			</div>
			<div class="flex items-center gap-3">
				<Slider
					type="multiple"
					bind:value={magick.settings.deskewThreshold}
					max={100}
					min={0}
					step={1}
					class="flex-1"
				/>
				<span class="w-10 text-right font-mono text-[11px] font-bold"
					>{magick.settings.deskewThreshold[0]}%</span
				>
			</div>
		</div>

		<div class="space-y-2 border-t border-dashed border-border/60 pt-2">
			<Label
				class="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>
				Canvas Extent
			</Label>
			<div class="grid grid-cols-2 gap-2">
				<div class="relative">
					<span
						class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
						>W</span
					>
					<Input
						type="number"
						bind:value={magick.settings.extentW}
						placeholder="Auto"
						min="0"
						class="h-9 pl-8 font-mono text-xs"
					/>
				</div>
				<div class="relative">
					<span
						class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
						>H</span
					>
					<Input
						type="number"
						bind:value={magick.settings.extentH}
						placeholder="Auto"
						min="0"
						class="h-9 pl-8 font-mono text-xs"
					/>
				</div>
			</div>
			<div class="grid grid-cols-[1fr_auto] gap-2">
				<Select type="single" bind:value={magick.settings.extentGravity}>
					<SelectTrigger class="h-9 text-xs">
						{(magick.settings.extentGravity as string) || 'Gravity'}
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="Center">Center</SelectItem>
						<SelectItem value="NorthWest">Top Left</SelectItem>
						<SelectItem value="North">Top Center</SelectItem>
						<SelectItem value="NorthEast">Top Right</SelectItem>
						<SelectItem value="West">Left</SelectItem>
						<SelectItem value="East">Right</SelectItem>
						<SelectItem value="SouthWest">Bottom Left</SelectItem>
						<SelectItem value="South">Bottom Center</SelectItem>
						<SelectItem value="SouthEast">Bottom Right</SelectItem>
					</SelectContent>
				</Select>
				<div
					class="relative h-9 w-12 overflow-hidden rounded-sm border border-border shadow-sm transition-all duration-50 hover:ring-2 hover:ring-primary/50"
				>
					<input
						type="color"
						bind:value={magick.settings.extentBgColor}
						aria-label="Canvas background color"
						class="absolute inset-0 -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
						title="Background Color"
					/>
				</div>
			</div>
		</div>

		<div class="space-y-2 rounded-sm border border-border/40 bg-muted/20 p-3">
			<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>Border</Label
			>
			<div class="flex items-center gap-3">
				<div class="flex-1 space-y-1.5">
					<div class="flex justify-between">
						<span class="text-[11px] text-muted-foreground">Size</span>
						<span class="font-mono text-[11px] font-bold">{magick.settings.borderSize[0]}px</span>
					</div>
					<Slider
						type="multiple"
						bind:value={magick.settings.borderSize}
						max={50}
						min={0}
						step={1}
					/>
				</div>
				<div
					class="relative h-9 w-12 overflow-hidden rounded-sm border border-border shadow-sm transition-all duration-50 hover:ring-2 hover:ring-primary/50"
				>
					<input
						type="color"
						bind:value={magick.settings.borderColor}
						aria-label="Border color"
						class="absolute inset-0 -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
						title="Border Color"
					/>
				</div>
			</div>
		</div>
	</AccordionContent>
</AccordionItem>
