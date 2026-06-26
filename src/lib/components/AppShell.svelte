<script lang="ts">
	import TopBar from './TopBar.svelte';
	import ToolRail from './ToolRail.svelte';
	import CanvasViewport from './CanvasViewport.svelte';
	import PropertiesPanel from './PropertiesPanel.svelte';
	import StatusBar from './StatusBar.svelte';
	import ConfirmDialog from './ConfirmDialog.svelte';
	import type { MagickState } from '$lib/useMagick.svelte';
	import type { HistoryState } from '$lib/hooks/useHistory.svelte';
	import type { PresetsState } from '$lib/hooks/usePresets.svelte';
	import type { ReplaceGuardState } from '$lib/hooks/useReplaceGuard.svelte';
	import type { EditorSection, SampleImage } from '$lib/editor-types';

	let {
		magick,
		history,
		presets,
		guard,
		debugMode,
		isDarkMode,
		activeSection = $bindable('geometry'),
		viewport = $bindable(null),
		isDragging = false,
		onToggleDebug,
		onToggleTheme,
		onToggleShortcuts,
		onProcess,
		onReset,
		onDownload,
		onUndo,
		onRedo,
		onReplace,
		onClose
	}: {
		magick: MagickState;
		history: HistoryState;
		presets: PresetsState;
		guard: ReplaceGuardState;
		debugMode: boolean;
		isDarkMode: boolean;
		activeSection?: EditorSection;
		viewport?: ReturnType<typeof CanvasViewport> | null;
		isDragging?: boolean;
		onToggleDebug: () => void;
		onToggleTheme: () => void;
		onToggleShortcuts: () => void;
		onProcess: () => void;
		onReset: () => void;
		onDownload: () => void;
		onUndo: () => void;
		onRedo: () => void;
		onReplace: (file: File) => Promise<void>;
		onClose: () => void;
	} = $props();

	let fileInputEl = $state<HTMLInputElement | null>(null);
	let viewportZoom = $state(100);

	function openFilePicker() {
		fileInputEl?.click();
	}

	async function onFileInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			guard.requestReplace(target.files[0], onReplace);
		}
		target.value = '';
	}

	async function onSelectSample(s: SampleImage) {
		try {
			const res = await fetch(s.url);
			const blob = await res.blob();
			const file = new File([blob], `${s.name.toLowerCase()}.png`, {
				type: blob.type || 'image/png'
			});
			guard.requestReplace(file, onReplace);
		} catch {
			// ignore
		}
	}

	function onCloseRequest() {
		guard.requestClose(onClose);
	}

	function onViewportStateChange(st: { zoom: number }) {
		viewportZoom = st.zoom;
	}

	let confirmOpen = $derived(guard.pending != null);
	let pendingName = $derived(guard.pendingFile?.name ?? '');
	let confirmKind: 'close' | 'replace' = $derived(
		guard.pending?.kind === 'close' ? 'close' : 'replace'
	);

	function onConfirmReplace() {
		void guard.confirmPending();
	}
	function onCancelReplace() {
		guard.cancelPending();
	}
</script>

<!-- Hidden file input shared by rail upload + browse -->
<input
	bind:this={fileInputEl}
	type="file"
	accept="image/*"
	onchange={onFileInputChange}
	class="hidden"
/>

<div class="flex h-screen max-h-screen w-full flex-col overflow-hidden bg-background">
	<TopBar
		{magick}
		{history}
		{debugMode}
		{isDarkMode}
		{onToggleDebug}
		{onToggleTheme}
		{onToggleShortcuts}
		{onUndo}
		{onRedo}
		onClose={onCloseRequest}
	/>

	<div class="flex min-h-0 flex-1">
		<ToolRail
			{magick}
			bind:activeSection
			onUploadClick={openFilePicker}
			{onProcess}
			{onReset}
			{onDownload}
		/>

		<div class="min-w-0 flex-1">
			<CanvasViewport
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
				{isDragging}
				onBrowse={openFilePicker}
				{onSelectSample}
				onStateChange={onViewportStateChange}
			/>
		</div>

		<div class="hidden shrink-0 md:block" style="width: var(--panel-default);">
			<PropertiesPanel {magick} {history} {presets} bind:activeSection />
		</div>
	</div>

	<StatusBar {magick} zoomPct={viewportZoom} isDirty={guard.isDirty} />
</div>

<ConfirmDialog
	bind:open={confirmOpen}
	fileName={pendingName}
	kind={confirmKind}
	onConfirm={onConfirmReplace}
	onCancel={onCancelReplace}
/>
