<script lang="ts">
	import { AlertCircle, Loader2 } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';
	import { formatBytes } from '$lib/utils';

	let {
		magick,
		isDirty
	}: {
		magick: MagickState;
		zoomPct: number;
		isDirty: boolean;
	} = $props();

	function sizeDelta() {
		if (!magick.processedImageUrl || magick.originalImageSize <= 0) return null;
		// Estimate processed size from statsMessage ("... New Size: X KB (Y%)")
		const m = magick.statsMessage.match(/New Size:\s*([\d.]+)\s*KB(?:\s*\(([-+]?[\d.]+)%\))?/);
		if (!m) return null;
		const kb = parseFloat(m[1]);
		const pct = m[2] != null ? parseFloat(m[2]) : null;
		return { kb, pct };
	}

	let delta = $derived(sizeDelta());
</script>

<div
	class="flex h-(--statusbar-h) shrink-0 items-center gap-3 border-t bg-background px-3 text-[11px] text-muted-foreground"
>
	<!-- Left: dimensions + format -->
	<div class="flex items-center gap-2 truncate">
		{#if magick.originalImageUrl}
			{#if magick.processedImageUrl && (magick.processedWidth || magick.processedHeight)}
				<span class="font-mono text-foreground/80"
					>{magick.originalWidth}×{magick.originalHeight}</span
				>
				<span class="text-muted-foreground/60">→</span>
				<span class="font-mono text-foreground"
					>{magick.processedWidth}×{magick.processedHeight}</span
				>
			{:else}
				<span class="font-mono text-foreground/80"
					>{magick.originalWidth}×{magick.originalHeight}</span
				>
			{/if}
			<span class="text-muted-foreground/60">·</span>
			{#if magick.processedImageFormat}
				<span class="font-mono text-[10px] text-foreground/80 uppercase">
					{magick.processedImageFormat}
				</span>
			{:else if magick.originalImageFormat}
				<span class="font-mono text-[10px] text-foreground/80 uppercase">
					{magick.originalImageFormat}
				</span>
			{/if}
			<span class="text-muted-foreground/60">·</span>
			<span class="font-mono">{formatBytes(magick.originalImageSize)}</span>
			{#if delta}
				<span class="text-muted-foreground/60">→</span>
				<span
					class="font-mono {delta.pct != null && delta.pct < 0
						? 'text-emerald-600 dark:text-emerald-400'
						: 'text-foreground/80'}"
				>
					{delta.kb} KB
				</span>
				{#if delta.pct != null}
					<span
						class="font-mono {delta.pct < 0
							? 'text-emerald-600 dark:text-emerald-400'
							: delta.pct > 0
								? 'text-amber-600 dark:text-amber-400'
								: 'text-muted-foreground'}"
					>
						({delta.pct > 0 ? '+' : ''}{delta.pct}%)
					</span>
				{/if}
			{/if}
		{:else}
			<span class="text-muted-foreground/50">No image</span>
		{/if}
	</div>

	<div class="ml-auto flex items-center gap-3">
		<!-- Center-right: status / processing step -->
		{#if magick.hasError}
			<span class="flex items-center gap-1 font-medium text-destructive">
				<AlertCircle class="size-3" />
				<span class="max-w-[40ch] truncate">{magick.errorMessage || 'Error'}</span>
			</span>
		{:else if magick.isLoading}
			<span class="flex items-center gap-1 font-medium text-foreground">
				<Loader2 class="size-3 animate-spin" />
				<span>{magick.currentProcessingStep || 'Processing…'}</span>
			</span>
		{/if}

		<!-- Dirty indicator -->
		{#if isDirty}
			<span class="flex items-center gap-1 text-foreground/70" title="Unsaved edits">
				<span class="size-1.5 rounded-full bg-amber-500"></span>
				<span>Unsaved</span>
			</span>
		{/if}
	</div>
</div>
