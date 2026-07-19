<script lang="ts">
	import type { EditorSection, RailItem } from '$lib/editor-types';
	import type { MagickState } from '$lib/useMagick.svelte';
	import type { HistoryState } from '$lib/hooks/useHistory.svelte';
	import { isGeoDirty, isColorDirty, isFiltersDirty, isExportDirty } from '$lib/utils';
	import { DEFAULT_SETTINGS } from '$lib/useMagick.svelte';

	let {
		activeSection = $bindable(),
		magick,
		history,
		debugMode = false,
		isDarkMode = false,
		onUploadClick,
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
				if (
					s.imageFormat === DEFAULT_SETTINGS.imageFormat &&
					s.quality[0] === DEFAULT_SETTINGS.quality[0]
				) {
					return '';
				}
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
				class="group flex w-full cursor-pointer items-center justify-between text-left transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none {activeSection ===
				item.id
					? 'font-bold text-foreground'
					: 'text-muted-foreground'}"
				aria-label="{item.label} (Alt+{item.shortcut})"
				aria-pressed={activeSection === item.id}
			>
				<span class="inline-flex items-center gap-1.5 truncate"
					><span>[{activeSection === item.id ? '*' : ' '}]</span><span class="hover:underline">{item.label}</span></span
				>
				<div class="flex shrink-0 items-center gap-1">
					<span class="w-3 text-center text-xs text-muted-foreground/60 {item.dirty ? '' : 'invisible'}">^</span>
					{#if sectionSummary(item.id)}
						{@const lines = sectionSummary(item.id).split(' · ')}
						<span class="group/tip relative">
							<span
								class="block truncate text-[10px] font-normal text-muted-foreground/60 normal-case max-w-24 hover:text-foreground/60"
								>{sectionSummary(item.id)}</span
							>
							<span
								class="pointer-events-none absolute left-full top-1/2 z-50 ml-1.5 -translate-y-1/2 rounded-none border border-foreground/30 bg-[#f7f7f4] px-2 py-1 text-[11px] font-mono normal-case text-muted-foreground opacity-0 shadow-md transition-opacity group-hover/tip:opacity-100 max-md:hidden dark:bg-background dark:border-border"
							>
								<div class="flex flex-col gap-0.5 whitespace-nowrap">
									{#each lines as line}
										<span>{line}</span>
									{/each}
								</div>
							</span>
						</span>
					{/if}
				</div>
			</button>
		{/each}
	</div>

	<div class="mb-3 text-muted-foreground">/ACTIONS</div>
	<div class="flex flex-col gap-1.5">
		<button
			onclick={onUploadClick}
			class="group flex w-full cursor-pointer items-center justify-between text-left text-muted-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
		>
			<span class="truncate"><span>[ ]</span> <span class="hover:underline">UPLOAD</span></span>
		</button>

		<button
			onclick={onReset}
			disabled={!magick.sourceBytes}
			class="group flex w-full cursor-pointer items-center justify-between text-left text-muted-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		>
			<span class="truncate"><span>[ ]</span> <span class="hover:underline">RESET ALL</span></span>
		</button>
	</div>

	<div class="mt-auto mb-3 text-muted-foreground">/NAV</div>
	<div class="flex flex-col gap-1.5">
		<div class="flex border border-foreground/30 mb-2">
			<button
				onclick={onUndo}
				disabled={!history.canUndo}
				class="group flex-1 cursor-pointer px-2 py-1 text-center font-mono text-[11px] uppercase text-muted-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				[&lt;] <span class="group-hover:underline">UNDO</span>
			</button>
			<div class="w-px self-stretch bg-foreground/30"></div>
			<button
				onclick={onRedo}
				disabled={!history.canRedo}
				class="group flex-1 cursor-pointer px-2 py-1 text-center font-mono text-[11px] uppercase text-muted-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			>
				<span class="group-hover:underline">REDO</span> [&gt;]
			</button>
		</div>

		<button
			onclick={onToggleDebug}
			class="group flex w-full cursor-pointer items-center justify-between text-left text-muted-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none {debugMode
				? 'text-foreground'
				: ''}"
		>
			<span class="truncate"><span>[{debugMode ? '⚠' : 'B'}]</span> <span class="hover:underline">DEBUG</span></span>
		</button>

		<button
			onclick={onToggleTheme}
			class="group flex w-full cursor-pointer items-center justify-between text-left text-muted-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
		>
			<span class="truncate"><span>[{isDarkMode ? '~' : 'O'}]</span> <span class="hover:underline">THEME</span></span>
		</button>

		<button
			onclick={onToggleShortcuts}
			class="group flex w-full cursor-pointer items-center justify-between text-left text-muted-foreground transition-colors focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
		>
			<span class="truncate"><span>[?]</span> <span class="hover:underline">SHORTCUTS</span></span>
		</button>
	</div>
</aside>
