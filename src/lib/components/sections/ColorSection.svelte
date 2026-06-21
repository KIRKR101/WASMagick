<script lang="ts">
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import type { MagickState } from '$lib/useMagick.svelte';
	import SliderRow from '$lib/components/controls/SliderRow.svelte';
	import ToggleRow from '$lib/components/controls/ToggleRow.svelte';
	import SectionCard from '$lib/components/controls/SectionCard.svelte';

	let { magick } = $props<{ magick: MagickState }>();
</script>

<div class="space-y-5">
	<!-- Modulate -->
	<SectionCard title="Adjust">
		<div class="space-y-4">
			<SliderRow
				label="Brightness"
				bind:value={magick.settings.brightness}
				suffix="%"
				min={0}
				max={200}
			/>
			<SliderRow label="Contrast" bind:value={magick.settings.contrast} min={-100} max={100} />
			<SliderRow
				label="Saturation"
				bind:value={magick.settings.saturation}
				suffix="%"
				min={0}
				max={300}
			/>
			<SliderRow label="Hue" bind:value={magick.settings.hue} suffix="%" min={0} max={200} />
		</div>
	</SectionCard>

	<!-- Color space + auto operations -->
	<div class="space-y-2">
		<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
			>Color Space</span
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

	<div class="grid grid-cols-2 gap-2">
		<ToggleRow id="clr-normalize" label="Normalize" bind:checked={magick.settings.normalizeImage} />
		<ToggleRow id="clr-autolevel" label="Auto Level" bind:checked={magick.settings.autoLevel} />
	</div>

	<!-- Levels -->
	<SectionCard title="Levels">
		<div class="mb-3 flex items-center justify-start">
			<Select type="single" bind:value={magick.settings.levelChannels}>
				<SelectTrigger class="h-7 w-24 border-muted-foreground/30 px-2 text-[11px]">
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
			<SliderRow
				label="Black Point"
				bind:value={magick.settings.levelBlackpoint}
				min={0}
				max={100}
			/>
			<SliderRow
				label="White Point"
				bind:value={magick.settings.levelWhitepoint}
				min={0}
				max={100}
			/>
			<SliderRow
				label="Gamma"
				bind:value={magick.settings.levelGamma}
				min={0.1}
				max={3}
				step={0.1}
			/>
		</div>
	</SectionCard>

	<!-- Advanced -->
	<SectionCard title="Advanced Color">
		<div class="space-y-3">
			<SliderRow
				label="Threshold"
				bind:value={magick.settings.thresholdPercentage}
				suffix="%"
				min={0}
				max={100}
			/>
			<SliderRow
				label="Sigmoidal Contrast"
				bind:value={magick.settings.sigmoidalContrast}
				min={-20}
				max={20}
			/>
		</div>
	</SectionCard>
</div>
