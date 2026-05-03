<script lang="ts">
	import { onMount } from 'svelte';
	import CircleCheckIcon from '@lucide/svelte/icons/circle-check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import OctagonXIcon from '@lucide/svelte/icons/octagon-x';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	import { Toaster as Sonner, type ToasterProps as SonnerProps } from 'svelte-sonner';

	let { ...restProps }: SonnerProps = $props();

	let toastTheme = $state<'light' | 'dark'>('light');

	onMount(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const observer = new MutationObserver(() => {
			toastTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
		});
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		toastTheme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
		mq.addEventListener('change', () => {
			toastTheme = mq.matches ? 'dark' : 'light';
		});
		return () => {
			observer.disconnect();
			mq.removeEventListener('change', () => {});
		};
	});
</script>

<Sonner
	theme={toastTheme}
	class="toaster group"
	style={'--normal-bg: var(--background); --normal-text: var(--foreground); --normal-border: var(--border); --success-bg: var(--background); --success-text: var(--foreground); --error-bg: var(--background); --error-text: var(--foreground); --warning-bg: var(--background); --warning-text: var(--foreground); --info-bg: var(--background); --info-text: var(--foreground);'}
	{...restProps}
	>{#snippet loadingIcon()}
		<Loader2Icon class="size-4 animate-spin" />
	{/snippet}
	{#snippet successIcon()}
		<CircleCheckIcon class="size-4" />
	{/snippet}
	{#snippet errorIcon()}
		<OctagonXIcon class="size-4" />
	{/snippet}
	{#snippet infoIcon()}
		<InfoIcon class="size-4" />
	{/snippet}
	{#snippet warningIcon()}
		<TriangleAlertIcon class="size-4" />
	{/snippet}
</Sonner>
