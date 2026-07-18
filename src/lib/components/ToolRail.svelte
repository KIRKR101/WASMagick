<script lang="ts">
	import type { EditorSection, RailItem } from '$lib/editor-types';
	import type { MagickState } from '$lib/useMagick.svelte';
	import type { HistoryState } from '$lib/hooks/useHistory.svelte';
	import { isGeoDirty, isColorDirty, isFiltersDirty, isExportDirty } from '$lib/utils';

	let {
		activeSection = $bindable(),
		magick,
		history,
		debugMode = false,
		isDarkMode = false,
		onUploadClick,
		onProcess,
		onReset,
		onToggleDebug,
		onToggleTheme,
		onToggleShortcuts,
		onUndo,
		onRedo,
		onClose
	}: {
		activeSection?: EditorSection;
		magick: MagickState;
		history: HistoryState;
		debugMode?: boolean;
		isDarkMode?: boolean;
		onUploadClick: () => void;
		onProcess: () => void;
		onReset: () => void;
		onToggleDebug?: () => void;
		onToggleTheme?: () => void;
		onToggleShortcuts?: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
		onClose?: () => void;
	} = $props();

	function sectionSummary(id: EditorSection): string {
		const s = magick.settings;
		switch (id) {
			case 'geometry': {
				const parts: string[] = [];
				if (s.resizeW || s.resizeH) parts.push(`${s.resizeW ?? 'A'}×${s.resizeH ?? 'A'}`);
				if (s.rotate !== '0') parts.push(`${s.rotate}°`);
				return parts.join(' · ');
			}
			case 'color': {
				const parts: string[] = [];
				if (s.brightness[0] !== 100) parts.push(`Brt ${s.brightness[0]}%`);
				if (s.saturation[0] !== 100) parts.push(`Sat ${s.saturation[0]}%`);
				if (s.hue[0] !== 100) parts.push(`Hue ${s.hue[0]}%`);
				if (s.contrast[0] !== 0) parts.push(`Con ${s.contrast[0]}`);
				if (s.colorSpace !== 'RGB') parts.push(s.colorSpace);
				return parts.join(' · ');
			}
			case 'filters': {
				const parts: string[] = [];
				if (s.effect !== 'none') parts.push(s.effect);
				if (s.blur[0] > 0) parts.push(`Blur ${s.blur[0]}`);
				if (s.sharpen[0] > 0) parts.push(`Sharp ${s.sharpen[0]}`);
				return parts.join(' · ');
			}
			case 'export': {
				return `${s.imageFormat} ${s.quality[0]}%`;
			}
			default:
				return '';
		}
	}

	const items: RailItem[] = $derived([
		{ id: 'geometry', label: 'GEOMETRY', shortcut: '1', dirty: isGeoDirty(magick.settings) },
		{ id: 'color', label: 'COLOR', shortcut: '2', dirty: isColorDirty(magick.settings) },
		{ id: 'filters', label: 'FILTERS', shortcut: '3', dirty: isFiltersDirty(magick.settings) },
		{ id: 'export', label: 'EXPORT', shortcut: '4', dirty: isExportDirty(magick.settings) },
		{ id: 'presets', label: 'PRESETS', shortcut: '5' },
		{ id: 'history', label: 'HISTORY', shortcut: '6' }
	]);
</script>

<aside
	class="z-20 flex w-64 shrink-0 flex-col border-r border-foreground/30 bg-[#f7f7f4] px-4 py-4 font-mono text-sm uppercase dark:border-border dark:bg-background"
	aria-label="Tool rail"
>
	<div class="mb-3 text-muted-foreground">/TOOLS</div>

	<!-- Section buttons -->
	<div class="mb-6 flex flex-col gap-1.5">
		{#each items as item (item.id)}
			<button
				onclick={() => (activeSection = item.id)}
				class="group flex w-full items-center justify-between text-left transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none {activeSection ===
				item.id
					? 'font-bold text-foreground'
					: 'text-muted-foreground hover:text-foreground'}"
				aria-label="{item.label} (Alt+{item.shortcut})"
				aria-pressed={activeSection === item.id}
			>
				<span>[{activeSection === item.id ? '*' : ' '}] {item.label}</span>
				{#if item.dirty}
					<span class="text-xs">^</span>
				{/if}
				{#if sectionSummary(item.id)}
					<span
						class="truncate pl-2 text-[10px] font-normal text-muted-foreground/60 normal-case group-hover:text-foreground/60"
						>{sectionSummary(item.id)}</span
					>
				{/if}
			</button>
		{/each}
	</div>

	<div class="mb-3 text-muted-foreground">/ACTIONS</div>
	<div class="flex flex-col gap-1.5">
		<button
			onclick={onUploadClick}
			class="group flex w-full items-center justify-between text-left text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
		>
			<span>[ ] UPLOAD</span>
			<span class="text-[10px] opacity-70">Ctrl+O</span>
		</button>

		<button
			onclick={onProcess}
			disabled={!magick.wasmLoaded || !magick.sourceBytes}
			class="group flex w-full items-center justify-between text-left text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			<span>[{magick.isLoading ? '~' : ' '}] PROCESS</span>
			<span class="text-[10px] opacity-70">Ctrl+Enter</span>
		</button>

		<button
			onclick={onReset}
			disabled={!magick.sourceBytes}
			class="group flex w-full items-center justify-between text-left text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			<span>[ ] RESET ALL</span>
		</button>
	</div>

	<div class="mt-auto mb-3 text-muted-foreground">/NAV</div>
	<div class="flex flex-col gap-1.5">
		<div class="flex border border-foreground/30 mb-2">
			<button
				onclick={onUndo}
				disabled={!history.canUndo}
				class="flex-1 px-2 py-1 text-center font-mono text-[11px] uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				[&lt;] UNDO
			</button>
			<div class="w-px self-stretch bg-foreground/30"></div>
			<button
				onclick={onRedo}
				disabled={!history.canRedo}
				class="flex-1 px-2 py-1 text-center font-mono text-[11px] uppercase text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				REDO [&gt;]
			</button>
		</div>

		<button
			onclick={onToggleDebug}
			class="group flex w-full items-center justify-between text-left text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none {debugMode
				? 'text-foreground'
				: ''}"
		>
			<span>[B] DEBUG</span>
		</button>

		<button
			onclick={onToggleTheme}
			class="group flex w-full items-center justify-between text-left text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
		>
			<span>[{isDarkMode ? '~' : 'O'}] THEME</span>
		</button>

		<button
			onclick={onToggleShortcuts}
			class="group flex w-full items-center justify-between text-left text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
		>
			<span>[?] SHORTCUTS</span>
		</button>
	</div>
</aside>
