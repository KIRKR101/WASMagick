<script lang="ts">
	import type { MagickState } from '$lib/useMagick.svelte';
	import type { HistoryState } from '$lib/hooks/useHistory.svelte';
	import type { PresetsState } from '$lib/hooks/usePresets.svelte';
	import type { EditorSection } from '$lib/editor-types';
	import { isGeoDirty, isColorDirty, isFiltersDirty, isExportDirty } from '$lib/utils';

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
		presets,
		onUploadClick,
		onDownload,
		onClearRequest
	}: {
		activeSection: EditorSection;
		magick: MagickState;
		history: HistoryState;
		presets: PresetsState;
		onUploadClick: () => void;
		onDownload: () => void;
		onClearRequest?: () => void;
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

	let dirty = $derived({
		geometry: isGeoDirty(magick.settings),
		color: isColorDirty(magick.settings),
		filters: isFiltersDirty(magick.settings),
		export: isExportDirty(magick.settings),
		presets: false,
		history: false
	});
	let meta = $derived({ ...META[activeSection], dirty: dirty[activeSection] });
	let canDownload = $derived(!!magick.processedImageUrl);
</script>

<aside class="flex h-full w-full flex-col border-r border-foreground/30 bg-[#f7f7f4] font-mono text-sm dark:bg-background dark:border-border">


	<!-- Header for current section -->
	<div class="px-4 py-3 border-b border-foreground/30 flex justify-between items-center text-xs uppercase tracking-wider text-muted-foreground">
		<span>{meta.title}</span>
		{#if meta.reset && meta.dirty}
			<button class="hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" onclick={meta.reset}>[RESET]</button>
		{/if}
	</div>

	<!-- Body -->
	<div
		class="properties-panel-inner custom-scrollbar min-h-0 flex-1 overflow-y-auto p-4 {meta.scroll === false
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
			<HistoryPanel {magick} {history} {onClearRequest} />
		{/if}
	</div>

	<!-- Bottom Export Button -->
	<div class="p-4 border-t border-foreground/30 mt-auto bg-[#f7f7f4] dark:bg-background">
		<div class="flex justify-between items-center text-xs mb-3 text-muted-foreground uppercase">
			<span>Output format</span>
			<span class="underline underline-offset-2">{magick.settings.imageFormat}</span>
		</div>
		<button
			class="flex w-full items-center justify-between border border-foreground/30 bg-transparent text-muted-foreground px-3 py-2 hover:bg-foreground hover:text-background transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
			onclick={onDownload}
			disabled={!canDownload}
		>
			<span>Export canvas</span>
			<span class="text-xs opacity-70">Ctrl+S</span>
		</button>
	</div>
</aside>
