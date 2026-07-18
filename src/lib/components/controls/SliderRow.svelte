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

<div class={cn('space-y-1', className)}>
	<div class="flex items-center justify-between">
		<span class="font-mono text-xs uppercase text-foreground">{label}</span>
		<span class="font-mono text-xs font-semibold text-foreground tabular-nums"
			>{display}{suffix}</span
		>
	</div>
	<div class="relative flex items-center h-4">
		<div class="absolute inset-x-0 h-px border-b border-foreground/50 pointer-events-none"></div>
		<input
			type="range"
			{min}
			{max}
			{step}
			bind:value={value[0]}
			class="w-full appearance-none bg-transparent m-0 p-0 h-4 cursor-pointer focus:outline-none slider-raw"
		/>
	</div>
</div>
