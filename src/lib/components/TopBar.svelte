<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Sun, Moon, Bug, Keyboard, RotateCcw, X } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';
	import type { HistoryState } from '$lib/hooks/useHistory.svelte';
	import HoverTooltip from './controls/HoverTooltip.svelte';

	let {
		magick,
		history,
		debugMode,
		isDarkMode,
		onToggleDebug,
		onToggleTheme,
		onToggleShortcuts,
		onUndo,
		onRedo,
		onClose
	}: {
		magick: MagickState;
		history: HistoryState;
		debugMode: boolean;
		isDarkMode: boolean;
		onToggleDebug: () => void;
		onToggleTheme: () => void;
		onToggleShortcuts: () => void;
		onUndo: () => void;
		onRedo: () => void;
		onClose: () => void;
	} = $props();
</script>

<header
	class="relative z-30 flex h-[var(--topbar-h)] shrink-0 items-center gap-2 border-b bg-background px-3"
>
	<!-- Wordmark -->
	<span class="text-sm font-semibold tracking-tight">WASMagick</span>

	<!-- Filename -->
	{#if magick.originalImageUrl}
		<span class="text-muted-foreground/40 max-md:hidden">/</span>
		<span class="truncate text-xs font-medium text-foreground/80 max-md:hidden"
			>{magick.originalName}</span
		>
		<HoverTooltip label="Close image">
			<button
				onclick={onClose}
				class="flex size-5 items-center justify-center rounded-xs text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none max-md:hidden"
				aria-label="Close image"
			>
				<X class="size-3" />
			</button>
		</HoverTooltip>
	{/if}

	<!-- Right cluster -->
	<div class="ml-auto flex items-center gap-1">
		<HoverTooltip label="Undo (Ctrl+Z)">
			<Button
				onclick={onUndo}
				disabled={!history.canUndo}
				variant="ghost"
				size="icon-sm"
				aria-label="Undo (Ctrl+Z)"
			>
				<RotateCcw class="size-3.5" />
			</Button>
		</HoverTooltip>
		<HoverTooltip label="Redo (Ctrl+Shift+Z)">
			<Button
				onclick={onRedo}
				disabled={!history.canRedo}
				variant="ghost"
				size="icon-sm"
				aria-label="Redo (Ctrl+Shift+Z)"
			>
				<RotateCcw class="size-3.5 -scale-x-100" />
			</Button>
		</HoverTooltip>

		<div class="mx-1 h-5 w-px bg-border"></div>

		<HoverTooltip label="Debug Mode">
			<Button
				onclick={onToggleDebug}
				variant={debugMode ? 'secondary' : 'ghost'}
				size="icon-sm"
				aria-label="Debug Mode"
			>
				<Bug class="size-3.5" />
			</Button>
		</HoverTooltip>

		<HoverTooltip label="Toggle Theme">
			<Button onclick={onToggleTheme} variant="ghost" size="icon-sm" aria-label="Toggle Theme">
				{#if isDarkMode}
					<Moon class="size-3.5" />
				{:else}
					<Sun class="size-3.5" />
				{/if}
			</Button>
		</HoverTooltip>

		<HoverTooltip label="Shortcuts (Ctrl+Shift+?)">
			<Button
				onclick={onToggleShortcuts}
				variant="ghost"
				size="icon-sm"
				aria-label="Shortcuts (Ctrl+Shift+?)"
			>
				<Keyboard class="size-3.5" />
			</Button>
		</HoverTooltip>
	</div>
</header>
