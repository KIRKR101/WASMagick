<script lang="ts">
	import { cn } from '$lib/utils';

	let {
		title = '',
		children,
		class: className
	}: {
		title?: string;
		children?: import('svelte').Snippet;
		class?: string;
	} = $props();
</script>

<section class={cn('border border-foreground/30 bg-transparent p-3', className)}>
	{#if title}
		<h4 class="mb-2.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
			{title}
		</h4>
	{/if}
	{@render children?.()}
</section>
