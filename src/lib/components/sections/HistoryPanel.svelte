<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Undo2, Redo2, Trash2, ImageIcon } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';
	import type { HistoryState } from '$lib/hooks/useHistory.svelte';
	import { formatBytes } from '$lib/utils';

	let { magick, history }: { magick: MagickState; history: HistoryState } = $props();
</script>

<div class="flex h-full flex-col">
	<!-- Undo/redo controls -->
	<div class="flex shrink-0 gap-1.5 border-b border-border/60 pb-3">
		<Button
			onclick={() => history.undo(magick)}
			disabled={!history.canUndo}
			variant="outline"
			size="sm"
			class="flex-1"
		>
			<Undo2 class="size-3.5" />
			Undo
		</Button>
		<Button
			onclick={() => history.redo(magick)}
			disabled={!history.canRedo}
			variant="outline"
			size="sm"
			class="flex-1"
		>
			<Redo2 class="size-3.5" />
			Redo
		</Button>
		<Button
			onclick={() => history.clear()}
			disabled={history.count === 0}
			variant="ghost"
			size="icon-sm"
			aria-label="Clear history"
		>
			<Trash2 class="size-3.5" />
		</Button>
	</div>

	<div class="custom-scrollbar flex-1 overflow-y-auto pt-2">
		{#if history.entries.length === 0}
			<div class="flex flex-col items-center justify-center gap-2 py-10 text-center">
				<ImageIcon class="size-8 text-muted-foreground/40" />
				<p class="text-xs text-muted-foreground">No history yet</p>
				<p class="text-[11px] text-muted-foreground/60">Process an image to start tracking</p>
			</div>
		{:else}
			<ol class="space-y-1">
				{#each history.entries as entry, i (entry.id)}
					{@const isCurrent = i === history.pointer}
					<li>
						<button
							onclick={() => history.jumpTo(magick, entry.id)}
							class="flex w-full items-center gap-2.5 rounded-xs px-2 py-1.5 text-left transition-colors {isCurrent
								? 'bg-primary/10 ring-1 ring-primary/30'
								: 'hover:bg-muted/60'}"
							aria-current={isCurrent}
						>
							<div
								class="size-9 shrink-0 overflow-hidden rounded-xs border border-border/50 bg-muted"
							>
								<img
									src={entry.blobUrl}
									alt={entry.label}
									class="size-full object-cover"
									draggable="false"
								/>
							</div>
							<div class="min-w-0 flex-1">
								<div class="flex items-center justify-between gap-2">
									<span
										class="truncate text-xs font-semibold {isCurrent
											? 'text-foreground'
											: 'text-foreground/80'}"
									>
										{entry.label}
									</span>
									{#if entry.isOriginal}{:else if entry.time > 0}
										<span class="font-mono text-[10px] text-muted-foreground">{entry.time}ms</span>
									{/if}
								</div>
								<div class="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
									<span>{entry.width}×{entry.height}</span>
									<span class="text-muted-foreground/40">·</span>
									<span class="uppercase">{entry.format}</span>
									{#if entry.size > 0}
										<span class="text-muted-foreground/40">·</span>
										<span>{formatBytes(entry.size)}</span>
									{/if}
								</div>
							</div>
							{#if isCurrent}
								<span class="size-1.5 shrink-0 rounded-full bg-primary"></span>
							{/if}
						</button>
					</li>
				{/each}
			</ol>
		{/if}
	</div>
</div>
