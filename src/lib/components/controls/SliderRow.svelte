<script lang="ts">
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { cn } from '$lib/utils';

	let {
		label,
		value = $bindable(),
		suffix = '',
		min,
		max,
		step = 1,
		class: className
	}: {
		label: string;
		value: number[];
		suffix?: string;
		min: number;
		max: number;
		step?: number;
		class?: string;
	} = $props();

	let display = $derived(step < 1 ? value[0].toFixed(1) : String(value[0]));
</script>

<div class={cn('space-y-1.5', className)}>
	<div class="flex items-center justify-between">
		<span class="text-xs font-medium text-muted-foreground">{label}</span>
		<span class="font-mono text-xs font-semibold text-foreground tabular-nums"
			>{display}{suffix}</span
		>
	</div>
	<Slider type="multiple" bind:value {min} {max} {step} />
</div>
