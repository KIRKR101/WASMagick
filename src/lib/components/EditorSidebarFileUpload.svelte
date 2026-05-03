<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip/index.js';
	import { FileImage, Trash2 } from 'lucide-svelte';
	import type { MagickState } from '$lib/useMagick.svelte';

	let { magick, onFileChanged } = $props<{
		magick: MagickState;
		onFileChanged: () => void;
	}>();

	let isDragging = $state(false);

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
		</div>
	{/if}
</div>
