<script lang="ts">
	import {
		Upload,
		Ruler,
		Palette,
		Wand2,
		Download,
		Sparkles,
		History,
		Zap,
		RotateCcw,
		Loader2
	} from 'lucide-svelte';
	import type { EditorSection, RailItem } from '$lib/editor-types';
	import type { MagickState } from '$lib/useMagick.svelte';
	import HoverTooltip from './controls/HoverTooltip.svelte';

	let {
		activeSection = $bindable(),
		magick,
		onUploadClick,
		onProcess,
		onReset,
		onDownload
	}: {
		activeSection?: EditorSection;
		magick: MagickState;
		onUploadClick: () => void;
		onProcess: () => void;
		onReset: () => void;
		onDownload: () => void;
	} = $props();

	// Geometry / Color / Filters dirty checks
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

	const items: RailItem[] = $derived([
		{ id: 'geometry', label: 'Geometry', icon: Ruler, shortcut: '1', dirty: geoDirty },
		{ id: 'color', label: 'Color', icon: Palette, shortcut: '2', dirty: colorDirty },
		{ id: 'filters', label: 'Filters', icon: Wand2, shortcut: '3', dirty: filtersDirty },
		{ id: 'export', label: 'Export', icon: Download, shortcut: '4', dirty: exportDirty },
		{ id: 'presets', label: 'Presets', icon: Sparkles, shortcut: '5' },
		{ id: 'history', label: 'History', icon: History, shortcut: '6' }
	]);

	let canProcess = $derived(magick.wasmLoaded && !!magick.sourceBytes && !magick.isLoading);
	let canDownload = $derived(!!magick.processedImageUrl);
</script>

<aside
	class="z-20 flex w-[var(--rail-w)] shrink-0 flex-col items-center gap-1 border-r bg-background py-2"
	aria-label="Tool rail"
>
	<!-- Upload button (top, always visible) -->
	<HoverTooltip label="Upload (V)">
		<button
			onclick={onUploadClick}
			class="flex size-10 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
			aria-label="Upload (V)"
		>
			<Upload class="size-5" />
		</button>
	</HoverTooltip>

	<div class="my-1 h-px w-6 bg-border"></div>

	<!-- Section buttons -->
	{#each items as item (item.id)}
		{@const Icon = item.icon as typeof Ruler}
		<HoverTooltip>
			{#snippet labelChildren()}
				{item.label}
				<span class="ml-1 text-muted-foreground">Alt+{item.shortcut}</span>
			{/snippet}
			<button
				onclick={() => (activeSection = item.id)}
				class="relative flex size-10 items-center justify-center rounded-xs transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none {activeSection ===
				item.id
					? 'bg-primary text-primary-foreground'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
				aria-label="{item.label} (Alt+{item.shortcut})"
				aria-pressed={activeSection === item.id}
			>
				<Icon class="size-5" />
				{#if item.dirty}
					<span
						class="absolute top-1 right-1 size-1.5 rounded-full {activeSection === item.id
							? 'bg-primary-foreground'
							: 'bg-primary'}"
					></span>
				{/if}
			</button>
		</HoverTooltip>
	{/each}

	<!-- Spacer -->
	<div class="mt-auto"></div>

	<!-- Bottom action cluster: Process / Reset / Download -->
	<div class="mt-1 flex flex-col items-center gap-1 border-t border-border/60 pt-2">
		<HoverTooltip>
			{#snippet labelChildren()}
				{magick.isLoading ? 'Processing…' : 'Process'}
				<span class="ml-1 text-muted-foreground">Ctrl+Enter</span>
			{/snippet}
			<button
				onclick={onProcess}
				disabled={!canProcess}
				class="flex size-10 items-center justify-center rounded-xs bg-primary text-primary-foreground transition-all hover:bg-primary/90 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
				aria-label="Process (Ctrl+Enter)"
			>
				{#if magick.isLoading}
					<Loader2 class="size-5 animate-spin" />
				{:else}
					<Zap class="size-5" />
				{/if}
			</button>
		</HoverTooltip>
		<HoverTooltip label="Reset">
			<button
				onclick={onReset}
				disabled={!magick.sourceBytes}
				class="flex size-9 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
				aria-label="Reset Settings"
			>
				<RotateCcw class="size-4" />
			</button>
		</HoverTooltip>
		<HoverTooltip>
			{#snippet labelChildren()}
				Download
				<span class="ml-1 text-muted-foreground">Ctrl+S</span>
			{/snippet}
			<button
				onclick={onDownload}
				disabled={!canDownload}
				class="flex size-9 items-center justify-center rounded-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40"
				aria-label="Download (Ctrl+S)"
			>
				<Download class="size-4" />
			</button>
		</HoverTooltip>
	</div>
</aside>
