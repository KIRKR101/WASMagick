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
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion/index.js';
	import { Download } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';

	let { magick } = $props<{ magick: MagickState }>();
</script>

<AccordionItem value="export" class="border-b px-4">
	<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
		<div class="flex items-center gap-2.5">
			<Download class="h-4 w-4 text-primary" />
			<span class="text-xs font-bold tracking-wider uppercase">Export</span>
		</div>
	</AccordionTrigger>
	<AccordionContent class="space-y-4 pb-4">
		<div class="grid grid-cols-2 gap-3">
			<div class="space-y-2">
				<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
					>Format</Label
				>
				<Select type="single" bind:value={magick.settings.imageFormat}>
					<SelectTrigger class="h-9 text-xs">
						{(magick.settings.imageFormat as string) || 'Select Format'}
					</SelectTrigger>
					<SelectContent>
						{#each ['WebP', 'JPEG', 'PNG', 'AVIF', 'JXL', 'TIFF', 'GIF'] as fmt}
							<SelectItem value={fmt}>{fmt}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>Quality</Label
					>
					<span class="font-mono text-[11px] font-bold text-foreground"
						>{magick.settings.quality[0]}%</span
					>
				</div>
				<Slider
					type="multiple"
					bind:value={magick.settings.quality}
					max={100}
					min={1}
					step={1}
					class="py-2"
				/>
			</div>
		</div>

		<label
			for="stripMeta"
			class="flex cursor-pointer items-center justify-between rounded-sm border border-border/50 bg-muted/40 p-3 transition-colors duration-50 hover:bg-muted/60"
		>
			<span class="text-[11px] font-medium">Strip Metadata (EXIF)</span>
			<Switch id="stripMeta" bind:checked={magick.settings.stripMeta} class="pointer-events-none" />
		</label>
	</AccordionContent>
</AccordionItem>
