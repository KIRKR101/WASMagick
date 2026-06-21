<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Sparkles, Trash2, Check, Plus } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';
	import type { MagickState } from '$lib/useMagick.svelte';
	import {
		PresetsState,
		BUILTIN_PRESETS,
		type BuiltInPreset,
		type UserPreset
	} from '$lib/hooks/usePresets.svelte';

	let { magick, presets }: { magick: MagickState; presets: PresetsState } = $props();

	let newName = $state('');

	function applyBuiltIn(p: BuiltInPreset) {
		presets.applyBuiltIn(magick, p);
		toast.success('Preset applied', { description: p.name });
	}
	function applyUser(p: UserPreset) {
		presets.applyUser(magick, p);
		toast.success('Preset applied', { description: p.name });
	}
	function save() {
		if (!newName.trim()) return;
		presets.saveUser(newName, magick);
		newName = '';
	}
</script>

<div class="space-y-5">
	<div class="space-y-2">
		<div class="flex items-center gap-1.5">
			<Sparkles class="size-3.5 text-muted-foreground" />
			<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>Built-in</span
			>
		</div>
		<div class="grid grid-cols-1 gap-1.5">
			{#each BUILTIN_PRESETS as p (p.id)}
				{@const active = presets.isBuiltInActive(magick, p)}
				<button
					onclick={() => applyBuiltIn(p)}
					aria-pressed={active}
					class="group flex items-center justify-between gap-3 rounded-xs border px-3 py-2 text-left transition-colors {active
						? 'border-primary bg-primary/10 ring-1 ring-primary/30'
						: 'border-border/50 bg-muted/30 hover:border-primary/40 hover:bg-muted/60'}"
				>
					<span class="min-w-0">
						<span
							class="block text-xs font-semibold {active ? 'text-foreground' : 'text-foreground'}"
							>{p.name}</span
						>
						<span class="block text-[11px] text-muted-foreground">{p.description}</span>
					</span>
					<Check
						class="size-3.5 shrink-0 text-primary transition-opacity {active
							? 'opacity-100'
							: 'opacity-0 group-hover:opacity-100'}"
					/>
				</button>
			{/each}
		</div>
	</div>

	<div class="space-y-2 border-t border-dashed border-border/60 pt-4">
		<div class="flex items-center gap-1.5">
			<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
				>My Presets</span
			>
		</div>

		<div class="flex gap-2">
			<Input
				bind:value={newName}
				placeholder="Preset name"
				class="h-8 text-xs"
				onkeydown={(e) => {
					if (e.key === 'Enter') save();
				}}
			/>
			<Button onclick={save} variant="outline" size="sm" class="shrink-0">
				<Plus class="size-3.5" />
				Save
			</Button>
		</div>
		<p class="text-[11px] text-muted-foreground">
			Saves the current settings as a reusable preset.
		</p>

		{#if presets.userPresets.length === 0}
			<p class="py-3 text-center text-[11px] text-muted-foreground/60">No saved presets yet</p>
		{:else}
			<div class="grid grid-cols-1 gap-1.5">
				{#each presets.userPresets as p (p.id)}
					{@const active = presets.isUserActive(magick, p)}
					<div
						class="group flex items-center gap-2 rounded-xs border px-3 py-2 transition-colors {active
							? 'border-primary bg-primary/10 ring-1 ring-primary/30'
							: 'border-border/50 bg-muted/30 hover:bg-muted/60'}"
					>
						<button
							onclick={() => applyUser(p)}
							aria-pressed={active}
							class="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
						>
							<span class="min-w-0">
								<span class="block truncate text-xs font-semibold text-foreground">{p.name}</span>
								<span class="block text-[11px] text-muted-foreground"
									>{p.settings.imageFormat} · q{p.settings.quality[0]}</span
								>
							</span>
							{#if active}
								<Check class="size-3.5 shrink-0 text-primary" />
							{/if}
						</button>
						<Button
							onclick={() => presets.deleteUser(p.id)}
							variant="ghost"
							size="icon-xs"
							class="shrink-0 text-muted-foreground hover:text-destructive"
							aria-label="Delete preset"
						>
							<Trash2 class="size-3" />
						</Button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
