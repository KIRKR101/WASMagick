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

<button
	type="button"
	id={id}
	class={cn(
		'flex w-full cursor-pointer items-center justify-between gap-3 px-1 py-1 transition-colors hover:bg-muted text-left focus:outline-none',
		className
	)}
	onclick={() => checked = !checked}
>
	<span class="min-w-0 flex items-center gap-2">
		<span class="font-mono text-sm text-foreground">[{checked ? '*' : ' '}]</span>
		<span class="block font-mono text-xs text-foreground uppercase">{label}</span>
		{#if description}
			<span class="block text-[10px] text-muted-foreground ml-2 uppercase">({description})</span>
		{/if}
	</span>
</button>
