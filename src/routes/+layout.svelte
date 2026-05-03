<script lang="ts">
	import './layout.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';

	let { children } = $props();
</script>

<Toaster />
<div aria-live="polite" aria-atomic="true" class="sr-only">Image editor ready</div>
{@render children()}
