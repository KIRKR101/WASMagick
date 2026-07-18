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

	<!-- Rotate + Transform + Auto Orient -->
	<div class="space-y-3 border-t border-dashed border-foreground/20 pt-4">
		<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>Rotate</span
		>
		<div class="grid grid-cols-2 gap-3">
			<select
				bind:value={magick.settings.rotate}
				class="h-9 w-full bg-transparent font-mono text-xs outline-none"
			>
				<option value="0">0° (None)</option>
				<option value="90">90° CW</option>
				<option value="180">180°</option>
				<option value="-90">270° CCW</option>
			</select>
			<div class="grid h-9 grid-cols-2 gap-1.5">
				<button
					type="button"
					class="flex cursor-pointer items-center justify-center gap-1 border border-foreground/30 bg-transparent px-1 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
					onclick={() => (magick.settings.flip = !magick.settings.flip)}
				>
					<span class="font-mono text-[11px] whitespace-pre"
						>[{magick.settings.flip ? '*' : ' '}]</span
					>
					<span class="font-mono text-[11px] uppercase">Flip</span>
				</button>
				<button
					type="button"
					class="flex cursor-pointer items-center justify-center gap-1 border border-foreground/30 bg-transparent px-1 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
					onclick={() => (magick.settings.flop = !magick.settings.flop)}
				>
					<span class="font-mono text-[11px] whitespace-pre"
						>[{magick.settings.flop ? '*' : ' '}]</span
					>
					<span class="font-mono text-[11px] uppercase">Flop</span>
				</button>
			</div>
		</div>
		<ToggleRow
			id="geo-auto-orient"
			label="Auto Orient"
			description="Apply EXIF orientation"
			bind:checked={magick.settings.autoOrient}
		/>
	</div>

	<!-- Deskew -->
	<div class="space-y-2 border-t border-dashed border-foreground/20 pt-4">
		<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>Deskew</span
		>
		<ToggleRow
			id="geo-deskew-crop"
			label="Auto Crop"
			bind:checked={magick.settings.deskewAutoCrop}
		/>
		<SliderRow
			label="Threshold"
			bind:value={magick.settings.deskewThreshold}
			suffix="%"
			min={0}
			max={100}
		/>
	</div>

	<!-- Canvas Extent -->
	<div class="space-y-2 border-t border-dashed border-foreground/20 pt-4">
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
		<div class="flex items-end gap-2">
			<select
				bind:value={magick.settings.extentGravity}
				class="h-9 flex-1 bg-transparent font-mono text-xs outline-none"
			>
				<option value="Center">Center</option>
				<option value="NorthWest">Top Left</option>
				<option value="North">Top Center</option>
				<option value="NorthEast">Top Right</option>
				<option value="West">Left</option>
				<option value="East">Right</option>
				<option value="SouthWest">Bottom Left</option>
				<option value="South">Bottom Center</option>
				<option value="SouthEast">Bottom Right</option>
			</select>
			<div class="flex flex-col items-center gap-0.5">
				<span class="font-mono text-[9px] text-muted-foreground/60 uppercase">BG</span>
				<div
					class="relative h-9 w-9 overflow-hidden border border-foreground/50 transition-all hover:border-foreground"
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
	</div>

	<!-- Border -->
	<div class="space-y-2 border-t border-dashed border-foreground/20 pt-4">
		<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>Border</span
		>
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
			<div class="flex flex-col items-center gap-0.5">
				<span class="font-mono text-[9px] text-muted-foreground/60 uppercase">COLOR</span>
				<div
					class="relative h-9 w-9 shrink-0 overflow-hidden border border-foreground/50 transition-all hover:border-foreground"
				>
					<input
						type="color"
						bind:value={magick.settings.borderColor}
						aria-label="Border color"
						class="absolute inset-0 -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
					/>
				</div>
			</div>
		</div>
	</div>
</div>
