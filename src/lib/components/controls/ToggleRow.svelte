<script lang="ts">
	import { Switch } from '$lib/components/ui/switch/index.js';
	import { cn } from '$lib/utils';

	let {
		id,
		label,
		description = '',
		checked = $bindable(),
		class: className
	}: {
		id: string;
		label: string;
		description?: string;
		checked: boolean;
		class?: string;
	} = $props();
</script>

<label
	for={id}
	class={cn(
		'flex cursor-pointer items-center justify-between gap-3 rounded-xs border border-border/60 bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/60',
		className
	)}
>
	<span class="min-w-0">
		<span class="block text-xs font-medium text-foreground">{label}</span>
		{#if description}
			<span class="block text-[11px] text-muted-foreground">{description}</span>
		{/if}
	</span>
	<Switch {id} bind:checked class="pointer-events-none shrink-0" />
</label>
