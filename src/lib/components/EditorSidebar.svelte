<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Accordion } from '$lib/components/ui/accordion/index.js';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		Moon,
		Sun,
		Bug,
		Download,
		RotateCw,
		AlertCircle,
		Keyboard,
		Zap
	} from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';
	import EditorSidebarFileUpload from './EditorSidebarFileUpload.svelte';
	import EditorSidebarExport from './EditorSidebarExport.svelte';
	import EditorSidebarGeometry from './EditorSidebarGeometry.svelte';
	import EditorSidebarColor from './EditorSidebarColor.svelte';
	import EditorSidebarFilters from './EditorSidebarFilters.svelte';

	let {
		magick,
		debugMode,
		isDarkMode,
		onToggleDebug,
		onToggleTheme,
		onFileChanged,
		processCurrent,
		activeSection = $bindable('geometry'),
		showShortcuts = $bindable(false)
	} = $props<{
		magick: MagickState;
		debugMode: boolean;
		isDarkMode: boolean;
		onToggleDebug: () => void;
		onToggleTheme: () => void;
		onFileChanged: () => void;
		processCurrent: () => void;
		activeSection?: 'geometry' | 'color' | 'filters' | 'export';
		showShortcuts?: boolean;
	}>();

	let activeAccordions = $state<string[]>([]);
	let prevActiveSection = $state<string>('geometry');

	$effect(() => {
		if (activeSection !== prevActiveSection) {
			if (!activeAccordions.includes(activeSection)) {
				activeAccordions = [...activeAccordions, activeSection];
			}
			prevActiveSection = activeSection;
		}
	});

	export function toggleSection(section: 'geometry' | 'color' | 'filters' | 'export') {
		if (activeAccordions.includes(section)) {
			activeAccordions = activeAccordions.filter((s) => s !== section);
		} else {
			activeAccordions = [...activeAccordions, section];
		}
		activeSection = section;
		prevActiveSection = section;
	}
</script>

<aside class="sidebar z-10 flex h-full max-h-screen flex-col border-r bg-background">
	<header
		class="relative z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 py-3 text-foreground"
	>
		<h1 class="text-sm font-semibold tracking-tight uppercase">WASMagick</h1>

		<div class="flex items-center gap-1">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={() => (showShortcuts = !showShortcuts)}
							variant="ghost"
							size="sm"
							class="h-8 w-8 cursor-pointer rounded-xs p-0"
						>
							<Keyboard class="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Keyboard Shortcuts (Ctrl+?)</p></TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={onToggleDebug}
							variant={debugMode ? 'secondary' : 'ghost'}
							size="sm"
							class="h-8 w-8 cursor-pointer rounded-xs p-0"
						>
							<Bug class="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Toggle Debug Mode</p></TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={onToggleTheme}
							variant="ghost"
							size="sm"
							class="h-8 w-8 cursor-pointer rounded-xs p-0"
						>
							{#if isDarkMode}
								<Moon class="h-4 w-4" />
							{:else}
								<Sun class="h-4 w-4" />
							{/if}
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Toggle Theme</p></TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	</header>

	<div class="scroll-container custom-scrollbar flex-grow overflow-y-auto">
		<EditorSidebarFileUpload {magick} {onFileChanged} />

		<div class="flex items-center justify-end border-b px-4 py-1.5">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<label
							for="auto-process"
							class="flex cursor-pointer items-center gap-1.5 rounded-xs px-1.5 py-0.5 transition-colors hover:bg-muted/50"
						>
							<Zap
								class="h-3 w-3 {magick.autoProcess ? 'text-primary' : 'text-muted-foreground'}"
							/>
							<span class="text-[10px] text-muted-foreground">Auto</span>
							<Switch
								id="auto-process"
								bind:checked={magick.autoProcess}
								class="pointer-events-none scale-75"
							/>
						</label>
					</TooltipTrigger>
					<TooltipContent><p>Auto-process when settings change</p></TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>

		<Accordion class="w-full" type="multiple" bind:value={activeAccordions} loop>
			<EditorSidebarExport {magick} />
			<EditorSidebarGeometry {magick} />
			<EditorSidebarColor {magick} />
			<EditorSidebarFilters {magick} />
		</Accordion>
	</div>

	<div class="z-20 shrink-0 space-y-3 border-t bg-background p-4">
		<div class="flex gap-2">
			{#if !magick.originalImageUrl}
				<Button
					disabled
					variant="secondary"
					class="h-11 flex-1 font-bold tracking-wider uppercase shadow-md transition-shadow duration-50 hover:shadow-lg enabled:cursor-pointer disabled:opacity-70"
				>
					Upload an Image
				</Button>
			{:else}
				<Button
					onclick={processCurrent}
					disabled={!magick.wasmLoaded || magick.isLoading}
					variant="secondary"
					class="h-11 flex-1 cursor-pointer font-bold tracking-wider uppercase shadow-md transition-shadow duration-50 hover:shadow-lg disabled:opacity-70"
				>
					{#if magick.isLoading}
						<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-75"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						Processing...
					{:else}
						Process Image
					{/if}
				</Button>
				<Button
					onclick={() => magick.resetSettings()}
					variant="outline"
					class="h-11 w-11 cursor-pointer p-0 shadow-sm transition-shadow duration-50 hover:shadow-md"
				>
					<RotateCw class="h-4 w-4" />
				</Button>
			{/if}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={() => magick.downloadImage()}
							disabled={!magick.processedImageUrl}
							variant="outline"
							class="h-11 w-11 cursor-pointer p-0 shadow-sm transition-shadow duration-50 hover:shadow-md"
						>
							<Download class="h-4 w-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent><p>Download Result</p></TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
		<div class="flex h-5 items-center justify-center">
			{#if magick.hasError}
				<span class="flex items-center gap-1 text-[11px] font-bold text-destructive">
					<AlertCircle class="h-3 w-3" />
					{magick.errorMessage || 'Error'}
				</span>
			{:else if magick.statsMessage && magick.statsMessage !== 'Ready'}
				<span class="font-mono text-[10px] text-primary">
					{magick.statsMessage}
				</span>
			{:else if !magick.wasmLoaded}
				<span class="text-[11px] font-bold text-amber-500"> Initializing WASM Engine... </span>
			{:else if !magick.originalImageUrl}
				<span class="text-[11px] font-semibold tracking-wide text-muted-foreground/50">
					Upload an image to begin
				</span>
			{:else}
				<span class="text-[11px] font-semibold tracking-wide text-muted-foreground/50">
					Ready to Process
				</span>
			{/if}
		</div>
	</div>
</aside>
