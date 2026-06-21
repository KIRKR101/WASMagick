<script lang="ts">
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { AlertTriangle } from 'lucide-svelte';

	let {
		open = $bindable(false),
		fileName = '',
		kind = 'replace',
		onConfirm,
		onCancel
	}: {
		open?: boolean;
		fileName?: string;
		kind?: 'replace' | 'close';
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();

	function confirm() {
		open = false;
		onConfirm();
	}
	function cancel() {
		open = false;
		onCancel();
	}
</script>

<Dialog bind:open>
	<DialogContent class="max-w-sm">
		<DialogHeader>
			<div
				class="mb-2 flex size-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400"
			>
				<AlertTriangle class="size-4" />
			</div>
			{#if kind === 'close'}
				<DialogTitle>Close current image?</DialogTitle>
				<DialogDescription>
					You have unsaved edits to the current image
					{#if fileName}<span class="font-medium text-foreground">({fileName})</span>{/if}. Closing
					it will discard the processed result and history.
				</DialogDescription>
			{:else}
				<DialogTitle>Replace current image?</DialogTitle>
				<DialogDescription>
					You have unsaved edits to the current image
					{#if fileName}<span class="font-medium text-foreground">({fileName})</span>{/if}.
					Replacing it will discard the processed result and history.
				</DialogDescription>
			{/if}
		</DialogHeader>
		<DialogFooter class="gap-2 sm:gap-2">
			<Button variant="outline" onclick={cancel}>Cancel</Button>
			<Button variant="destructive" onclick={confirm}>
				{kind === 'close' ? 'Close' : 'Replace'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
