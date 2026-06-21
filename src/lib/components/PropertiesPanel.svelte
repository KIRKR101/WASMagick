<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { RefreshCcw } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';
	import type { HistoryState } from '$lib/hooks/useHistory.svelte';
	import type { PresetsState } from '$lib/hooks/usePresets.svelte';
	import type { EditorSection } from '$lib/editor-types';
	import HoverTooltip from './controls/HoverTooltip.svelte';

	import GeometrySection from './sections/GeometrySection.svelte';
	import ColorSection from './sections/ColorSection.svelte';
	import FiltersSection from './sections/FiltersSection.svelte';
	import ExportSection from './sections/ExportSection.svelte';
	import PresetsSection from './sections/PresetsSection.svelte';
	import HistoryPanel from './sections/HistoryPanel.svelte';

	let {
		activeSection = $bindable('geometry'),
		magick,
		history,
		presets
	}: {
		activeSection: EditorSection;
		magick: MagickState;
		history: HistoryState;
		presets: PresetsState;
	} = $props();

	const META: Record<
		EditorSection,
		{ title: string; subtitle: string; reset?: () => void; scroll?: boolean; dirty?: boolean }
	> = {
		geometry: {
			title: 'Geometry',
			subtitle: 'Size · rotation · canvas',
			reset: () => magick.resetGeometry()
		},
		color: { title: 'Color', subtitle: 'Tone · levels · space', reset: () => magick.resetColor() },
		filters: {
			title: 'Filters',
			subtitle: 'Effects · blur · sharpen',
			reset: () => magick.resetFilters()
		},
		export: {
			title: 'Export',
			subtitle: 'Format · quality · metadata',
			reset: () => magick.resetExport()
		},
		presets: { title: 'Presets', subtitle: 'Reusable recipes' },
		history: { title: 'History', subtitle: 'Undo · redo · states', scroll: false }
	};

	let geoDirty = $derived(
		magick.settings.resizeW != null ||
			magick.settings.resizeH != null ||
			magick.settings.rotate !== '0' ||
			magick.settings.flip ||
			magick.settings.flop ||
			magick.settings.borderSize[0] > 0 ||
			magick.settings.extentW != null ||
			magick.settings.extentH != null ||
			magick.settings.deskewThreshold[0] > 0 ||
			magick.settings.autoOrient
	);
	let colorDirty = $derived(
		magick.settings.normalizeImage ||
			magick.settings.autoLevel ||
			magick.settings.brightness[0] !== 100 ||
			magick.settings.contrast[0] !== 0 ||
			magick.settings.saturation[0] !== 100 ||
			magick.settings.hue[0] !== 100 ||
			magick.settings.levelBlackpoint[0] !== 0 ||
			magick.settings.levelWhitepoint[0] !== 100 ||
			magick.settings.levelGamma[0] !== 1.0 ||
			magick.settings.thresholdPercentage[0] !== 50 ||
			magick.settings.sigmoidalContrast[0] !== 0 ||
			magick.settings.colorSpace !== 'RGB'
	);
	let filtersDirty = $derived(
		magick.settings.effect !== 'none' ||
			magick.settings.blur[0] > 0 ||
			magick.settings.sharpen[0] > 0
	);
	let exportDirty = $derived(
		magick.settings.imageFormat !== 'WebP' ||
			magick.settings.quality[0] !== 85 ||
			!magick.settings.stripMeta
	);

	const DIRTY: Record<EditorSection, () => boolean> = {
		geometry: () => geoDirty,
		color: () => colorDirty,
		filters: () => filtersDirty,
		export: () => exportDirty,
		presets: () => false,
		history: () => false
	};

	let meta = $derived({ ...META[activeSection], dirty: DIRTY[activeSection]() });
</script>

<aside class="flex h-full w-full flex-col border-l bg-background">
	<!-- Header -->
	<header class="flex h-12 shrink-0 items-center justify-between gap-2 border-b px-4">
		<div class="min-w-0">
			<h2 class="text-sm font-semibold tracking-tight">{meta.title}</h2>
			<p class="truncate text-[11px] text-muted-foreground">{meta.subtitle}</p>
		</div>
		<div class="flex shrink-0 items-center gap-1">
			{#if meta.reset && meta.dirty}
				<HoverTooltip label="Reset {meta.title}">
					<Button
						onclick={meta.reset}
						variant="ghost"
						size="icon-sm"
						aria-label="Reset {meta.title}"
					>
						<RefreshCcw class="size-3.5" />
					</Button>
				</HoverTooltip>
			{/if}
		</div>
	</header>

	<!-- Body -->
	<div
		class="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 {meta.scroll === false
			? 'overflow-hidden'
			: ''}"
	>
		{#if activeSection === 'geometry'}
			<GeometrySection {magick} />
		{:else if activeSection === 'color'}
			<ColorSection {magick} />
		{:else if activeSection === 'filters'}
			<FiltersSection {magick} />
		{:else if activeSection === 'export'}
			<ExportSection {magick} />
		{:else if activeSection === 'presets'}
			<PresetsSection {magick} {presets} />
		{:else if activeSection === 'history'}
			<HistoryPanel {magick} {history} />
		{/if}
	</div>
</aside>
