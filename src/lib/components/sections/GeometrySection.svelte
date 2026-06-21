<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import type { MagickState } from '$lib/useMagick.svelte';
	import SliderRow from '$lib/components/controls/SliderRow.svelte';
	import ToggleRow from '$lib/components/controls/ToggleRow.svelte';
	import SectionCard from '$lib/components/controls/SectionCard.svelte';

	let { magick } = $props<{ magick: MagickState }>();
</script>

<div class="space-y-5">
	<!-- Resize -->
	<div class="space-y-2">
		<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>Resize</span
		>
		<div class="grid grid-cols-2 gap-2">
			<div class="relative">
				<span
					class="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[11px] font-bold text-muted-foreground"
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
					class="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[11px] font-bold text-muted-foreground"
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

	<!-- Rotate + Transform -->
	<div class="grid grid-cols-2 gap-3">
		<div class="space-y-2">
			<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>Rotate</span
			>
			<Select type="single" bind:value={magick.settings.rotate}>
				<SelectTrigger class="h-9 text-xs">
					{#if magick.settings.rotate === '0'}0°{:else}{magick.settings.rotate}°{/if}
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
			<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>Transform</span
			>
			<div class="grid h-9 grid-cols-2 gap-1.5">
				<label
					for="geo-flip"
					class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-border/50 bg-muted/40 px-2 transition-colors hover:bg-muted/60"
				>
					<Switch id="geo-flip" bind:checked={magick.settings.flip} class="pointer-events-none" />
					<span class="text-[11px] font-semibold">Flip</span>
				</label>
				<label
					for="geo-flop"
					class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-border/50 bg-muted/40 px-2 transition-colors hover:bg-muted/60"
				>
					<Switch id="geo-flop" bind:checked={magick.settings.flop} class="pointer-events-none" />
					<span class="text-[11px] font-semibold">Flop</span>
				</label>
			</div>
		</div>
	</div>

	<ToggleRow
		id="geo-auto-orient"
		label="Auto Orient"
		description="Apply EXIF orientation"
		bind:checked={magick.settings.autoOrient}
	/>

	<!-- Deskew -->
	<SectionCard title="Deskew">
		<div class="flex items-center justify-between">
			<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>Auto Crop</span
			>
			<Switch
				id="geo-deskew-crop"
				bind:checked={magick.settings.deskewAutoCrop}
				class="pointer-events-none scale-90"
			/>
		</div>
		<div class="mt-3">
			<SliderRow
				label="Threshold"
				bind:value={magick.settings.deskewThreshold}
				suffix="%"
				min={0}
				max={100}
			/>
		</div>
	</SectionCard>

	<!-- Canvas Extent -->
	<div class="space-y-2 border-t border-dashed border-border/60 pt-4">
		<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>Canvas Extent</span
		>
		<div class="grid grid-cols-2 gap-2">
			<div class="relative">
				<span
					class="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[11px] font-bold text-muted-foreground"
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
					class="absolute top-1/2 left-3 -translate-y-1/2 font-mono text-[11px] font-bold text-muted-foreground"
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
				class="relative h-9 w-12 overflow-hidden rounded-xs border border-border transition-all hover:ring-2 hover:ring-primary/50"
			>
				<input
					type="color"
					bind:value={magick.settings.extentBgColor}
					aria-label="Canvas background color"
					class="absolute inset-0 -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
				/>
			</div>
		</div>
	</div>

	<!-- Border -->
	<SectionCard title="Border">
		<div class="flex items-end gap-3">
			<div class="flex-1">
				<SliderRow
					label="Size"
					bind:value={magick.settings.borderSize}
					suffix="px"
					min={0}
					max={50}
				/>
			</div>
			<div
				class="relative h-9 w-12 shrink-0 overflow-hidden rounded-xs border border-border transition-all hover:ring-2 hover:ring-primary/50"
			>
				<input
					type="color"
					bind:value={magick.settings.borderColor}
					aria-label="Border color"
					class="absolute inset-0 -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
				/>
			</div>
		</div>
	</SectionCard>
</div>
