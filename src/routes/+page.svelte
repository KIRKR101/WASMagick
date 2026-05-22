<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { UploadCloud, Settings2, X } from 'lucide-svelte';
	import EditorSidebar from '$lib/components/EditorSidebar.svelte';
	import ImageViewport from '$lib/components/ImageViewport.svelte';
	import KeyboardShortcuts from '$lib/components/KeyboardShortcuts.svelte';
	import { useMagick } from '$lib/useMagick.svelte';

	const magick = useMagick();
	let debugMode = $state(false);
	let isDarkMode = $state(false);
	let globalDragging = $state(false);
	let sidebarOpen = $state(false);
	let showShortcuts = $state(false);

	let viewport = $state<ReturnType<typeof ImageViewport> | null>(null);
	let activeSection = $state<'geometry' | 'color' | 'filters' | 'export'>('geometry');
	let editorSidebarRef = $state<ReturnType<typeof EditorSidebar> | null>(null);

	function toggleDarkMode() {
		isDarkMode = !isDarkMode;
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
			localStorage.setItem('theme', 'dark');
		} else {
			document.documentElement.classList.remove('dark');
			localStorage.setItem('theme', 'light');
		}
	}

	function handleToggleSection(_section: 'geometry' | 'color' | 'filters' | 'export') {
		editorSidebarRef?.toggleSection(_section);
	}

	function processCurrent() {
		if (!magick.sourceBytes) return;
		magick.processImage(debugMode, () => {
			if (viewport) viewport.fitImageToScreen();
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (
			e.target instanceof HTMLInputElement ||
			e.target instanceof HTMLTextAreaElement ||
			e.target instanceof HTMLSelectElement
		)
			return;

		const cmdOrCtrl = e.ctrlKey || e.metaKey;

		if (cmdOrCtrl && e.key === 'Enter') {
			e.preventDefault();
			processCurrent();
		} else if (cmdOrCtrl && (e.key === 's' || e.key === 'S')) {
			e.preventDefault();
			magick.downloadImage();
		} else if (cmdOrCtrl && e.key === '0') {
			e.preventDefault();
			if (viewport) viewport.resetView();
		} else if (cmdOrCtrl && e.key === '=') {
			e.preventDefault();
			if (viewport) viewport.zoomIn();
		} else if (cmdOrCtrl && e.key === '-') {
			e.preventDefault();
			if (viewport) viewport.zoomOut();
		} else if (e.altKey && e.key === '1') {
			e.preventDefault();
			handleToggleSection('export');
		} else if (e.altKey && e.key === '2') {
			e.preventDefault();
			handleToggleSection('geometry');
		} else if (e.altKey && e.key === '3') {
			e.preventDefault();
			handleToggleSection('color');
		} else if (e.altKey && e.key === '4') {
			e.preventDefault();
			handleToggleSection('filters');
		} else if (cmdOrCtrl && e.shiftKey && (e.key === '?' || e.key === '/')) {
			e.preventDefault();
			showShortcuts = !showShortcuts;
		}
	}

	async function handleGlobalDrop(e: DragEvent) {
		e.preventDefault();
		globalDragging = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			if (await magick.setSourceFile(files[0])) {
				setTimeout(() => viewport?.fitImageToScreen(), 100);
			}
		}
	}

	// Auto-process: re-process when settings change and autoProcess is on
	let prevSettingsSnap = $state<string | null>(null);

	$effect(() => {
		if (!magick.autoProcess || !magick.sourceBytes) return;
		const snap = JSON.stringify(magick.settings);
		if (snap === prevSettingsSnap) return;
		prevSettingsSnap = snap;
		if (untrack(() => magick.isLoading)) return;
		magick.debouncedProcess(debugMode, () => {
			if (viewport) viewport.fitImageToScreen();
		});
	});

	onMount(async () => {
		if (
			localStorage.getItem('theme') === 'dark' ||
			(!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			document.documentElement.classList.add('dark');
			isDarkMode = true;
		} else {
			document.documentElement.classList.remove('dark');
			isDarkMode = false;
		}

		magick.initWorker();
		await magick.initWasm(debugMode);
	});
</script>

<svelte:window onkeydown={handleKeydown} />
<svelte:document
	ondragover={(e) => {
		e.preventDefault();
		globalDragging = true;
	}}
	ondragleave={(e) => {
		if (
			!e.relatedTarget ||
			!(e.relatedTarget instanceof Node && document.documentElement.contains(e.relatedTarget))
		) {
			globalDragging = false;
		}
	}}
	ondrop={handleGlobalDrop}
/>

<div
	class="app-layout grid max-h-screen min-h-screen w-full grid-cols-1 overflow-hidden md:grid-cols-[var(--sidebar-width)_1fr] dark:bg-zinc-950"
>
	{#if !sidebarOpen}
		<button
			class="fixed top-2 left-2 z-30 rounded-md border bg-background/80 p-2 shadow-lg backdrop-blur-sm md:hidden"
			onclick={() => (sidebarOpen = true)}
			aria-label="Open menu"
		>
			<Settings2 class="h-5 w-5" />
		</button>
	{/if}
	{#if globalDragging}
		<div
			class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-200"
		>
			<div class="pointer-events-none animate-in text-center duration-200 zoom-in-95">
				<div
					class="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/20"
				>
					<UploadCloud class="h-10 w-10 text-white" />
				</div>
				<p class="text-lg font-medium text-white">Drop your image here</p>
			</div>
		</div>
	{/if}

	<div
		class="fixed inset-y-0 left-0 z-40 w-[var(--sidebar-width)] transform bg-background transition-transform duration-200 md:relative md:translate-x-0 {sidebarOpen
			? 'translate-x-0'
			: '-translate-x-full'} md:block"
	>
		<EditorSidebar
			bind:this={editorSidebarRef}
			{magick}
			{debugMode}
			{isDarkMode}
			onToggleDebug={() => (debugMode = !debugMode)}
			onToggleTheme={toggleDarkMode}
			onFileChanged={() => setTimeout(() => viewport?.fitImageToScreen(), 100)}
			bind:activeSection
			bind:showShortcuts
			{processCurrent}
		/>
		<button
			class="absolute top-2 right-2 rounded-md border bg-background/80 p-1 shadow-lg backdrop-blur-sm md:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Close menu"
		>
			<X class="h-4 w-4" />
		</button>
	</div>

	{#if sidebarOpen}
		<button
			class="fixed inset-0 z-30 bg-black/50 md:hidden"
			onclick={() => (sidebarOpen = false)}
			aria-label="Close overlay"
		></button>
	{/if}

	<ImageViewport
		bind:this={viewport}
		originalImageUrl={magick.originalImageUrl}
		processedImageUrl={magick.processedImageUrl}
		isLoading={magick.isLoading}
		wasmLoaded={magick.wasmLoaded}
		originalWidth={magick.originalWidth}
		originalHeight={magick.originalHeight}
		originalFormat={magick.originalImageFormat}
		processedWidth={magick.processedWidth}
		processedHeight={magick.processedHeight}
		processedFormat={magick.processedImageFormat}
		currentProcessingStep={magick.currentProcessingStep}
	/>
</div>

<KeyboardShortcuts bind:open={showShortcuts} />
