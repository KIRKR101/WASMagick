<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '$lib/components/ui/select/index.js';
	import { Slider } from '$lib/components/ui/slider/index.js';
	import { Switch } from '$lib/components/ui/switch/index.js';
	import {
		Accordion,
		AccordionContent,
		AccordionItem,
		AccordionTrigger
	} from '$lib/components/ui/accordion/index.js';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip/index.js';
	import {
		Moon,
		Sun,
		Bug,
		Download,
		RotateCw,
		RefreshCcw,
		FileImage,
		Settings2,
		Palette,
		Wand2,
		Maximize,
		Trash2,
		AlertCircle
	} from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';
	import KeyboardShortcuts from './KeyboardShortcuts.svelte';

	let {
		magick,
		debugMode,
		isDarkMode,
		onToggleDebug,
		onToggleTheme,
		onFileChanged,
		activeSection = $bindable('geometry')
	} = $props<{
		magick: MagickState;
		debugMode: boolean;
		isDarkMode: boolean;
		onToggleDebug: () => void;
		onToggleTheme: () => void;
		onFileChanged: () => void;
		onToggleSection?: (section: 'geometry' | 'color' | 'filters' | 'export') => void;
		activeSection?: 'geometry' | 'color' | 'filters' | 'export';
	}>();

	let isDragging = $state(false);
	let activeAccordions = $state<string[]>([]);
	let prevActiveSection = $state<string>('geometry');
	let showShortcuts = $state(false);

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

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave() {
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		const files = e.dataTransfer?.files;
		if (files && files.length > 0) {
			if (await magick.setSourceFile(files[0])) {
				onFileChanged();
			}
		}
	}

	async function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			if (await magick.setSourceFile(target.files[0])) {
				onFileChanged();
			}
		}
	}

	function formatFileSize(bytes: number) {
		if (bytes < 1024) return bytes + ' B';
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
		return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
	}
</script>

<aside class="sidebar z-10 flex h-full max-h-screen flex-col border-r bg-background select-none">
	<header
		class="relative z-20 flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 py-3 text-foreground"
	>
		<div class="flex items-center gap-2">
			<div class="flex h-6 w-6 items-center justify-center rounded bg-primary">
				<Settings2 class="h-4 w-4 text-primary-foreground" />
			</div>
			<h1 class="text-sm font-semibold tracking-tight uppercase">WASMagick</h1>
		</div>

		<div class="flex items-center gap-1">
			<KeyboardShortcuts bind:open={showShortcuts} />

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
		<!-- File Section -->
		<div class="space-y-3 border-b p-4">
			{#if !magick.originalImageUrl}
				<Label
					for="fileInput"
					class={`drop-zone group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xs border-2 border-dashed px-4 py-8 transition-all duration-50 ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50'}`}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<FileImage
						class="h-8 w-8 text-muted-foreground transition-colors duration-50 group-hover:text-primary"
					/>
					<div class="text-center">
						<p class="text-xs font-medium text-foreground">Drop image here or click to browse</p>
						<p class="mt-1 text-[11px] text-muted-foreground">Supports any common format</p>
					</div>
					<Input
						type="file"
						id="fileInput"
						accept="image/*"
						onchange={handleFileChange}
						class="hidden"
					/>
				</Label>
			{:else}
				<div class="space-y-2">
					<div
						class="group flex items-center gap-3 rounded-xs border border-border bg-background p-2.5 shadow-sm transition-all duration-50 hover:border-muted-foreground/30"
					>
						<div
							class="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/50 bg-muted"
						>
							<img src={magick.originalImageUrl} class="h-full w-full object-cover" alt="Source" />
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-[11px] font-semibold text-foreground">
								{magick.originalName}
							</p>
							<p class="text-[11px] text-muted-foreground">
								{magick.originalWidth} × {magick.originalHeight} · {formatFileSize(
									magick.originalImageSize
								)}
							</p>
						</div>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Button
										onclick={() => magick.clearSource()}
										variant="ghost"
										size="icon"
										class="h-8 w-8 cursor-pointer transition-all duration-50 hover:bg-destructive/10 hover:text-destructive"
									>
										<Trash2 class="h-3.5 w-3.5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent><p>Remove Image</p></TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<Button
						onclick={() => magick.resetSettings()}
						variant="outline"
						size="sm"
						class="h-8 w-full gap-1.5 text-[11px] font-semibold tracking-wider uppercase transition-colors duration-50 hover:bg-muted"
					>
						<RotateCw class="h-3 w-3" />
						Reset All Settings
					</Button>
				</div>
			{/if}
		</div>

		<!-- Tools Accordion -->
		<Accordion class="w-full" type="multiple" bind:value={activeAccordions} loop>
			<!-- Export Section -->
			<AccordionItem value="export" class="border-b px-4">
				<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
					<div class="flex items-center gap-2.5">
						<Download class="h-4 w-4 text-primary" />
						<span class="text-xs font-bold tracking-wider uppercase">Export</span>
					</div>
				</AccordionTrigger>
				<AccordionContent class="space-y-4 pb-4">
					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-2">
							<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
								>Format</Label
							>
							<Select type="single" bind:value={magick.settings.imageFormat}>
								<SelectTrigger class="h-9 text-xs">
									{(magick.settings.imageFormat as string) || 'Select Format'}
								</SelectTrigger>
								<SelectContent>
									{#each ['WebP', 'JPEG', 'PNG', 'AVIF', 'JXL', 'TIFF', 'GIF'] as fmt, index}
										{#key index}
											<SelectItem value={fmt}>{fmt}</SelectItem>
										{/key}
									{/each}
								</SelectContent>
							</Select>
						</div>
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Quality</Label
								>
								<span class="font-mono text-[11px] font-bold text-foreground"
									>{magick.settings.quality[0]}%</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.quality}
								max={100}
								min={1}
								step={1}
								class="py-2"
							/>
						</div>
					</div>

					<label
						for="stripMeta"
						class="flex cursor-pointer items-center justify-between rounded-sm border border-border/50 bg-muted/40 p-3 transition-colors duration-50 hover:bg-muted/60"
					>
						<span class="text-[11px] font-medium">Strip Metadata (EXIF)</span>
						<Switch
							id="stripMeta"
							bind:checked={magick.settings.stripMeta}
							class="pointer-events-none"
						/>
					</label>
				</AccordionContent>
			</AccordionItem>

			<!-- Geometry Section -->
			<AccordionItem value="geometry" class="border-b px-4">
				<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
					<div class="flex w-full flex-1 items-center justify-between gap-2.5 pr-2">
						<div class="flex items-center gap-2.5">
							<Maximize class="h-4 w-4 text-primary" />
							<span class="text-xs font-bold tracking-wider uppercase">Geometry</span>
							{#if magick.settings.resizeW || magick.settings.resizeH || magick.settings.rotate !== '0' || magick.settings.flip || magick.settings.flop}
								<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
							{/if}
						</div>
						<Button
							onclick={(e) => {
								e.stopPropagation();
								magick.resetGeometry();
							}}
							variant="ghost"
							size="icon"
							class="h-6 w-6 opacity-0 transition-opacity duration-50 group-hover:opacity-100"
						>
							<RefreshCcw class="h-3 w-3 text-muted-foreground" />
						</Button>
					</div>
				</AccordionTrigger>
				<AccordionContent class="space-y-5 pb-4">
					<div class="space-y-2">
						<Label
							class="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>
							Resize (pixels)
						</Label>
						<div class="grid grid-cols-2 gap-2">
							<div class="relative">
								<span
									class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
									>W</span
								>
								<Input
									type="number"
									bind:value={magick.settings.resizeW}
									placeholder="Auto"
									class="h-9 pl-8 font-mono text-xs"
								/>
							</div>
							<div class="relative">
								<span
									class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
									>H</span
								>
								<Input
									type="number"
									bind:value={magick.settings.resizeH}
									placeholder="Auto"
									class="h-9 pl-8 font-mono text-xs"
								/>
							</div>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-3">
						<div class="space-y-2">
							<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
								>Rotate</Label
							>
							<Select type="single" bind:value={magick.settings.rotate}>
								<SelectTrigger class="h-9 text-xs">
									{#if magick.settings.rotate === '0'}
										0° (None)
									{:else}
										{magick.settings.rotate}°
									{/if}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">0° (None)</SelectItem>
									<SelectItem value="90">90° CW</SelectItem>
									<SelectItem value="180">180°</SelectItem>
									<SelectItem value="-90">270° CCW</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div class="space-y-2">
							<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
								>Transform</Label
							>
							<div class="grid h-9 grid-cols-2 gap-1.5">
								<label
									for="flip"
									class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-border/50 bg-muted/40 px-2 transition-colors duration-50 hover:bg-muted/60"
								>
									<Switch
										id="flip"
										bind:checked={magick.settings.flip}
										class="pointer-events-none"
									/>
									<span class="text-[11px] font-semibold">Flip</span>
								</label>
								<label
									for="flop"
									class="flex cursor-pointer items-center justify-center gap-1.5 rounded-xs border border-border/50 bg-muted/40 px-2 transition-colors duration-50 hover:bg-muted/60"
								>
									<Switch
										id="flop"
										bind:checked={magick.settings.flop}
										class="pointer-events-none"
									/>
									<span class="text-[11px] font-semibold">Flop</span>
								</label>
							</div>
						</div>
					</div>

					<label
						for="autoOrient"
						class="flex cursor-pointer items-center justify-between rounded-sm border border-border/50 bg-muted/40 p-3 transition-colors duration-50 hover:bg-muted/60"
					>
						<span class="text-[11px] font-medium">Auto Orient (from EXIF)</span>
						<Switch
							id="autoOrient"
							bind:checked={magick.settings.autoOrient}
							class="pointer-events-none"
						/>
					</label>

					<div class="space-y-2 rounded-sm border border-border/40 bg-muted/20 p-3">
						<div class="flex items-center justify-between">
							<span class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
								>Deskew</span
							>
							<label for="deskewAutoCrop" class="flex cursor-pointer items-center gap-2">
								<span class="text-[11px] text-muted-foreground">Auto Crop</span>
								<Switch
									id="deskewAutoCrop"
									bind:checked={magick.settings.deskewAutoCrop}
									class="pointer-events-none scale-75"
								/>
							</label>
						</div>
						<div class="flex items-center gap-3">
							<Slider
								type="multiple"
								bind:value={magick.settings.deskewThreshold}
								max={100}
								min={0}
								step={1}
								class="flex-1"
							/>
							<span class="w-10 text-right font-mono text-[11px] font-bold"
								>{magick.settings.deskewThreshold[0]}%</span
							>
						</div>
					</div>

					<div class="space-y-2 border-t border-dashed border-border/60 pt-2">
						<Label
							class="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
						>
							Canvas Extent
						</Label>
						<div class="grid grid-cols-2 gap-2">
							<div class="relative">
								<span
									class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
									>W</span
								>
								<Input
									type="number"
									bind:value={magick.settings.extentW}
									placeholder="Auto"
									class="h-9 pl-8 font-mono text-xs"
								/>
							</div>
							<div class="relative">
								<span
									class="absolute top-1/2 left-3 -translate-y-1/2 text-[11px] font-bold text-muted-foreground"
									>H</span
								>
								<Input
									type="number"
									bind:value={magick.settings.extentH}
									placeholder="Auto"
									class="h-9 pl-8 font-mono text-xs"
								/>
							</div>
						</div>
						<div class="grid grid-cols-[1fr_auto] gap-2">
							<Select type="single" bind:value={magick.settings.extentGravity}>
								<SelectTrigger class="h-9 text-xs">
									{(magick.settings.extentGravity as string) || 'Gravity'}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="Center">Center</SelectItem>
									<SelectItem value="NorthWest">Top Left</SelectItem>
									<SelectItem value="North">Top Center</SelectItem>
									<SelectItem value="NorthEast">Top Right</SelectItem>
									<SelectItem value="West">Left</SelectItem>
									<SelectItem value="East">Right</SelectItem>
									<SelectItem value="SouthWest">Bottom Left</SelectItem>
									<SelectItem value="South">Bottom Center</SelectItem>
									<SelectItem value="SouthEast">Bottom Right</SelectItem>
								</SelectContent>
							</Select>
							<div
								class="relative h-9 w-12 overflow-hidden rounded-sm border border-border shadow-sm transition-all duration-50 hover:ring-2 hover:ring-primary/50"
							>
								<input
									type="color"
									bind:value={magick.settings.extentBgColor}
									class="absolute inset-0 -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
									title="Background Color"
								/>
							</div>
						</div>
					</div>

					<div class="space-y-2 rounded-sm border border-border/40 bg-muted/20 p-3">
						<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
							>Border</Label
						>
						<div class="flex items-center gap-3">
							<div class="flex-1 space-y-1.5">
								<div class="flex justify-between">
									<span class="text-[11px] text-muted-foreground">Size</span>
									<span class="font-mono text-[11px] font-bold"
										>{magick.settings.borderSize[0]}px</span
									>
								</div>
								<Slider
									type="multiple"
									bind:value={magick.settings.borderSize}
									max={50}
									min={0}
									step={1}
								/>
							</div>
							<div
								class="relative h-9 w-12 overflow-hidden rounded-sm border border-border shadow-sm transition-all duration-50 hover:ring-2 hover:ring-primary/50"
							>
								<input
									type="color"
									bind:value={magick.settings.borderColor}
									class="absolute inset-0 -top-1/2 -left-1/2 h-[200%] w-[200%] cursor-pointer border-0 p-0"
									title="Border Color"
								/>
							</div>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>

			<!-- Color Section -->
			<AccordionItem value="color" class="border-b px-4">
				<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
					<div class="flex w-full flex-1 items-center justify-between gap-2.5 pr-2">
						<div class="flex items-center gap-2.5">
							<Palette class="h-4 w-4 text-primary" />
							<span class="text-xs font-bold tracking-wider uppercase">Color</span>
							{#if magick.settings.normalizeImage || magick.settings.autoLevel || magick.settings.brightness[0] !== 100 || magick.settings.contrast[0] !== 0 || magick.settings.saturation[0] !== 100 || magick.settings.hue[0] !== 100}
								<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
							{/if}
						</div>
						<Button
							onclick={(e) => {
								e.stopPropagation();
								magick.resetColor();
							}}
							variant="ghost"
							size="icon"
							class="h-6 w-6 opacity-0 transition-opacity duration-50 group-hover:opacity-100"
						>
							<RefreshCcw class="h-3 w-3 text-muted-foreground" />
						</Button>
					</div>
				</AccordionTrigger>
				<AccordionContent class="space-y-5 pb-4">
					<div class="space-y-4">
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Brightness</Label
								>
								<span class="font-mono text-[11px] font-bold">{magick.settings.brightness[0]}%</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.brightness}
								min={0}
								max={200}
								step={1}
							/>
						</div>
						<!-- Contrast, Saturation, Hue -->
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Contrast</Label
								>
								<span class="font-mono text-[11px] font-bold">{magick.settings.contrast[0]}</span>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.contrast}
								min={-100}
								max={100}
								step={1}
							/>
						</div>
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Saturation</Label
								>
								<span class="font-mono text-[11px] font-bold">{magick.settings.saturation[0]}%</span
								>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.saturation}
								min={0}
								max={300}
								step={1}
							/>
						</div>
						<div class="space-y-1.5">
							<div class="flex items-center justify-between">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Hue</Label
								>
								<span class="font-mono text-[11px] font-bold">{magick.settings.hue[0]}%</span>
							</div>
							<Slider type="multiple" bind:value={magick.settings.hue} min={0} max={200} step={1} />
						</div>
					</div>

					<div class="space-y-3 border-t border-dashed border-border/60 pt-3">
						<div class="grid grid-cols-2 gap-2">
							<div class="space-y-2">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Color Space</Label
								>
								<Select type="single" bind:value={magick.settings.colorSpace}>
									<SelectTrigger class="h-9 text-xs">
										{(magick.settings.colorSpace as string) || 'RGB'}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="RGB">RGB</SelectItem>
										<SelectItem value="Gray">Grayscale</SelectItem>
										<SelectItem value="CMYK">CMYK</SelectItem>
										<SelectItem value="HSL">HSL</SelectItem>
										<SelectItem value="HSV">HSV</SelectItem>
										<SelectItem value="LAB">LAB</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div class="grid grid-cols-1 gap-2">
								<div class="flex items-end">
									<label
										for="normalize"
										class="flex h-9 w-full cursor-pointer items-center justify-between rounded-xs border border-border/50 bg-muted/40 px-2.5 transition-colors duration-50 hover:bg-muted/60"
									>
										<span class="text-[11px] font-medium">Normalize</span>
										<Switch
											id="normalize"
											bind:checked={magick.settings.normalizeImage}
											class="pointer-events-none scale-75"
										/>
									</label>
								</div>
							</div>
						</div>

						<label
							for="autoLevel"
							class="flex cursor-pointer items-center justify-between rounded-xs border border-border/50 bg-muted/40 px-2.5 py-2 transition-colors duration-50 hover:bg-muted/60"
						>
							<span class="text-[11px] font-medium">Auto Level</span>
							<Switch
								id="autoLevel"
								bind:checked={magick.settings.autoLevel}
								class="pointer-events-none scale-75"
							/>
						</label>
					</div>

					<!-- Levels -->
					<div class="space-y-3 border-t border-dashed border-border/60 pt-3">
						<div class="flex items-center justify-between">
							<Label
								class="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
							>
								Levels
							</Label>
							<Select type="single" bind:value={magick.settings.levelChannels}>
								<SelectTrigger class="h-7 w-20 border-muted-foreground/30 px-2 text-[11px]">
									{(magick.settings.levelChannels as string) || 'All'}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="All">All</SelectItem>
									<SelectItem value="Red">Red</SelectItem>
									<SelectItem value="Green">Green</SelectItem>
									<SelectItem value="Blue">Blue</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div class="space-y-3">
							<div class="space-y-1.5">
								<div class="flex justify-between">
									<span class="text-[11px] text-muted-foreground">Black Point</span>
									<span class="font-mono text-[11px] font-bold"
										>{magick.settings.levelBlackpoint[0]}</span
									>
								</div>
								<Slider
									type="multiple"
									bind:value={magick.settings.levelBlackpoint}
									max={100}
									min={0}
									step={1}
								/>
							</div>
							<div class="space-y-1.5">
								<div class="flex justify-between">
									<span class="text-[11px] text-muted-foreground">White Point</span>
									<span class="font-mono text-[11px] font-bold"
										>{magick.settings.levelWhitepoint[0]}</span
									>
								</div>
								<Slider
									type="multiple"
									bind:value={magick.settings.levelWhitepoint}
									max={100}
									min={0}
									step={1}
								/>
							</div>
							<div class="space-y-1.5">
								<div class="flex justify-between">
									<span class="text-[11px] text-muted-foreground">Gamma</span>
									<span class="font-mono text-[11px] font-bold"
										>{magick.settings.levelGamma[0].toFixed(1)}</span
									>
								</div>
								<Slider
									type="multiple"
									bind:value={magick.settings.levelGamma}
									max={3}
									min={0.1}
									step={0.1}
								/>
							</div>
						</div>
					</div>

					<!-- Advanced -->
					<Accordion type="single" class="w-full border-t border-dashed border-border/60">
						<AccordionItem value="adv" class="border-0">
							<AccordionTrigger
								class="py-2.5 text-[11px] tracking-wider text-muted-foreground uppercase transition-colors duration-50 hover:text-foreground hover:no-underline"
								>Advanced Color</AccordionTrigger
							>
							<AccordionContent class="space-y-3 pt-2">
								<div class="space-y-1.5">
									<div class="flex items-center justify-between">
										<span class="text-[11px] text-muted-foreground">Threshold</span>
										<span class="font-mono text-[11px] font-bold"
											>{magick.settings.thresholdPercentage[0]}%</span
										>
									</div>
									<Slider
										type="multiple"
										bind:value={magick.settings.thresholdPercentage}
										max={100}
										min={0}
										step={1}
									/>
								</div>
								<div class="space-y-1.5">
									<div class="flex items-center justify-between">
										<span class="text-[11px] text-muted-foreground">Sigmoidal Contrast</span>
										<span class="font-mono text-[11px] font-bold"
											>{magick.settings.sigmoidalContrast[0]}</span
										>
									</div>
									<Slider
										type="multiple"
										bind:value={magick.settings.sigmoidalContrast}
										max={20}
										min={-20}
										step={1}
									/>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</AccordionContent>
			</AccordionItem>

			<!-- Filters Section -->
			<AccordionItem value="filters" class="border-b px-4">
				<AccordionTrigger class="group cursor-pointer py-3.5 hover:no-underline">
					<div class="flex w-full flex-1 items-center justify-between gap-2.5 pr-2">
						<div class="flex items-center gap-2.5">
							<Wand2 class="h-4 w-4 text-primary" />
							<span class="text-xs font-bold tracking-wider uppercase">Filters</span>
							{#if magick.settings.effect !== 'none' || magick.settings.blur[0] > 0 || magick.settings.sharpen[0] > 0}
								<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
							{/if}
						</div>
						<Button
							onclick={(e) => {
								e.stopPropagation();
								magick.resetFilters();
							}}
							variant="ghost"
							size="icon"
							class="h-6 w-6 opacity-0 transition-opacity duration-50 group-hover:opacity-100"
						>
							<RefreshCcw class="h-3 w-3 text-muted-foreground" />
						</Button>
					</div>
				</AccordionTrigger>
				<AccordionContent class="space-y-4 pb-4">
					<div class="space-y-2">
						<Label class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
							>Effect Preset</Label
						>
						<Select type="single" bind:value={magick.settings.effect}>
							<SelectTrigger class="h-9">
								{#if magick.settings.effect === 'none'}
									None (Original)
								{:else if magick.settings.effect === 'grayscale'}
									Grayscale
								{:else if magick.settings.effect === 'sepia'}
									Sepia Tone
								{:else if magick.settings.effect === 'charcoal'}
									Charcoal Sketch
								{:else if magick.settings.effect === 'negate'}
									Negative
								{:else if magick.settings.effect === 'cannyEdge'}
									Edge Detection
								{:else if magick.settings.effect === 'oilpaint'}
									Oil Paint
								{:else if magick.settings.effect === 'solarize'}
									Solarize
								{:else if magick.settings.effect === 'bilateralBlur'}
									Bilateral Blur
								{:else}
									{magick.settings.effect as string}
								{/if}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">None (Original)</SelectItem>
								<SelectItem value="grayscale">Grayscale</SelectItem>
								<SelectItem value="sepia">Sepia Tone</SelectItem>
								<SelectItem value="charcoal">Charcoal Sketch</SelectItem>
								<SelectItem value="negate">Negative</SelectItem>
								<SelectItem value="cannyEdge">Edge Detection</SelectItem>
								<SelectItem value="oilpaint">Oil Paint</SelectItem>
								<SelectItem value="solarize">Solarize</SelectItem>
								<SelectItem value="bilateralBlur">Bilateral Blur</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{#if magick.settings.effect !== 'none'}
						<div
							class="animate-in space-y-3 rounded-sm border border-border bg-muted/30 p-3 duration-50 fade-in slide-in-from-top-2"
						>
							{#if magick.settings.effect === 'sepia'}
								<div class="space-y-1.5">
									<div class="flex justify-between">
										<span class="text-[11px] font-medium text-muted-foreground">Threshold</span>
										<span class="font-mono text-[11px] font-bold"
											>{magick.settings.sepiaThreshold[0]}%</span
										>
									</div>
									<Slider
										type="multiple"
										bind:value={magick.settings.sepiaThreshold}
										max={100}
										min={0}
										step={1}
									/>
								</div>
							{/if}

							{#if magick.settings.effect === 'oilpaint'}
								<div class="space-y-1.5">
									<div class="flex justify-between">
										<span class="text-[11px] font-medium text-muted-foreground">Radius</span>
										<span class="font-mono text-[11px] font-bold"
											>{magick.settings.oilpaintRadius[0]}</span
										>
									</div>
									<Slider
										type="multiple"
										bind:value={magick.settings.oilpaintRadius}
										max={15}
										min={0}
										step={0.5}
									/>
								</div>
							{/if}

							{#if magick.settings.effect === 'solarize'}
								<div class="space-y-1.5">
									<div class="flex justify-between">
										<span class="text-[11px] font-medium text-muted-foreground">Factor</span>
										<span class="font-mono text-[11px] font-bold"
											>{magick.settings.solarizeFactor[0]}%</span
										>
									</div>
									<Slider
										type="multiple"
										bind:value={magick.settings.solarizeFactor}
										max={100}
										min={0}
										step={1}
									/>
								</div>
							{/if}

							{#if magick.settings.effect === 'cannyEdge'}
								<div class="space-y-3">
									<div class="space-y-1.5">
										<div class="flex justify-between">
											<span class="text-[11px] font-medium text-muted-foreground">Strength</span>
											<span class="font-mono text-[11px] font-bold"
												>{magick.settings.cannyEdgeStrength[0]}</span
											>
										</div>
										<Slider
											type="multiple"
											bind:value={magick.settings.cannyEdgeStrength}
											max={10}
											min={0}
											step={0.1}
										/>
									</div>
									<div class="space-y-1.5">
										<div class="flex justify-between">
											<span class="text-[11px] font-medium text-muted-foreground"
												>Lower Threshold</span
											>
											<span class="font-mono text-[11px] font-bold"
												>{magick.settings.cannyEdgeLower[0]}%</span
											>
										</div>
										<Slider
											type="multiple"
											bind:value={magick.settings.cannyEdgeLower}
											max={100}
											min={0}
											step={1}
										/>
									</div>
									<div class="space-y-1.5">
										<div class="flex justify-between">
											<span class="text-[11px] font-medium text-muted-foreground"
												>Upper Threshold</span
											>
											<span class="font-mono text-[11px] font-bold"
												>{magick.settings.cannyEdgeUpper[0]}%</span
											>
										</div>
										<Slider
											type="multiple"
											bind:value={magick.settings.cannyEdgeUpper}
											max={100}
											min={0}
											step={1}
										/>
									</div>
								</div>
							{/if}

							{#if magick.settings.effect === 'bilateralBlur'}
								<div class="space-y-3">
									<div class="space-y-1.5">
										<div class="flex justify-between">
											<span class="text-[11px] font-medium text-muted-foreground">Width</span>
											<span class="font-mono text-[11px] font-bold"
												>{magick.settings.bilateralWidth[0]}</span
											>
										</div>
										<Slider
											type="multiple"
											bind:value={magick.settings.bilateralWidth}
											max={20}
											min={0}
											step={1}
										/>
									</div>
									<div class="space-y-1.5">
										<div class="flex justify-between">
											<span class="text-[11px] font-medium text-muted-foreground">Height</span>
											<span class="font-mono text-[11px] font-bold"
												>{magick.settings.bilateralHeight[0]}</span
											>
										</div>
										<Slider
											type="multiple"
											bind:value={magick.settings.bilateralHeight}
											max={20}
											min={0}
											step={1}
										/>
									</div>
								</div>
							{/if}

							{#if ['grayscale', 'negate', 'charcoal'].includes(magick.settings.effect as string)}
								<div class="py-1 text-center text-[11px] text-muted-foreground">
									No additional parameters for this effect
								</div>
							{/if}
						</div>
					{/if}

					<!-- Blur & Sharpen -->
					<div class="grid grid-cols-2 gap-3 border-t border-dashed border-border/60 pt-3">
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Blur</Label
								>
								<span class="font-mono text-[11px] font-bold">{magick.settings.blur[0]}</span>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.blur}
								max={20}
								min={0}
								step={0.5}
							/>
						</div>
						<div class="space-y-1.5">
							<div class="flex justify-between">
								<Label
									class="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
									>Sharpen</Label
								>
								<span class="font-mono text-[11px] font-bold">{magick.settings.sharpen[0]}</span>
							</div>
							<Slider
								type="multiple"
								bind:value={magick.settings.sharpen}
								max={10}
								min={0}
								step={0.5}
							/>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>

			<!-- End Accordion -->
		</Accordion>
	</div>
	<div class="z-20 shrink-0 space-y-3 border-t bg-background p-4">
		<div class="flex gap-2">
			<Button
				onclick={() => magick.processImage(debugMode, () => onFileChanged())}
				disabled={!magick.wasmLoaded || !magick.originalImageUrl || magick.isLoading}
				variant="secondary"
				class="h-11 flex-1 font-bold tracking-wider uppercase shadow-md transition-shadow duration-50 hover:shadow-lg disabled:opacity-70"
			>
				{#if magick.isLoading}
					<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
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
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							onclick={() => magick.downloadImage()}
							disabled={!magick.processedImageUrl}
							variant="outline"
							class="h-11 w-11 p-0 shadow-sm transition-shadow duration-50 hover:shadow-md"
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
				<span class="font-mono text-[11px] font-bold tracking-widest text-primary">
					{magick.statsMessage}
				</span>
			{:else if !magick.wasmLoaded}
				<span class="text-[11px] font-bold text-amber-500"> Initializing WASM Engine... </span>
			{:else}
				<span class="text-[11px] font-semibold tracking-wide text-muted-foreground/50">
					Ready to Process
				</span>
			{/if}
		</div>
	</div>
</aside>
