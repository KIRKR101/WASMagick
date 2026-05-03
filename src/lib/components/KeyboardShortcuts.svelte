<script lang="ts">
	import { Command, X } from 'lucide-svelte';

	let { open = $bindable(false) } = $props<{ open?: boolean }>();

	const shortcuts = [
		{
			category: 'General',
			items: [
				{ keys: ['Ctrl', 'Enter'], description: 'Process Image' },
				{ keys: ['Ctrl', 'S'], description: 'Download Result' },
				{ keys: ['Ctrl', 'Shift', '?'], description: 'Show Shortcuts' }
			]
		},
		{
			category: 'Sections',
			items: [
				{ keys: ['Alt', '1'], description: 'Export Section' },
				{ keys: ['Alt', '2'], description: 'Geometry Section' },
				{ keys: ['Alt', '3'], description: 'Color Section' },
				{ keys: ['Alt', '4'], description: 'Filters Section' }
			]
		},
		{
			category: 'Viewport',
			items: [
				{ keys: ['Ctrl', '0'], description: 'Fit to Screen' },
				{ keys: ['Ctrl', '='], description: 'Zoom In' },
				{ keys: ['Ctrl', '-'], description: 'Zoom Out' },
				{ keys: ['Scroll'], description: 'Zoom In/Out' },
				{ keys: ['Drag'], description: 'Pan Image' }
			]
		},
		{
			category: 'Compare',
			items: [{ keys: ['Space'], description: 'Hold to Compare (Before/After)' }]
		}
	];

	let previousActiveElement: HTMLElement | null = null;

	$effect(() => {
		if (open) {
			previousActiveElement = document.activeElement as HTMLElement;
			document.body.style.overflow = 'hidden';
		} else {
			document.body.style.overflow = '';
			previousActiveElement?.focus();
		}
	});

	function handleOverlayClick() {
		open = false;
	}

	function handleOverlayKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			return;
		}
		if (e.key === 'Tab') {
			const focusable = (e.currentTarget as HTMLElement).querySelectorAll(
				'button, [href], [tabindex]:not([tabindex="-1"])'
			);
			const first = focusable[0] as HTMLElement;
			const last = focusable[focusable.length - 1] as HTMLElement;
			if (e.shiftKey && document.activeElement === first) {
				e.preventDefault();
				last?.focus();
			} else if (!e.shiftKey && document.activeElement === last) {
				e.preventDefault();
				first?.focus();
			}
		}
	}
</script>

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
		onclick={handleOverlayClick}
		onkeydown={handleOverlayKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby="shortcuts-title"
		tabindex="-1"
	>
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div
			class="w-full max-w-lg animate-in rounded-lg border bg-background p-6 shadow-lg fade-in-0 zoom-in-95"
			onclick={(e) => e.stopPropagation()}
			tabindex="-1"
		>
			<div class="mb-2 flex items-center gap-2">
				<Command class="h-5 w-5" />
				<h2 id="shortcuts-title" class="text-lg font-semibold">Keyboard Shortcuts</h2>
			</div>
			<p class="mb-6 text-sm text-muted-foreground">
				Quick reference for all available keyboard shortcuts
			</p>

			<div class="max-h-[60vh] space-y-6 overflow-y-auto">
				{#each shortcuts as section}
					<div class="space-y-3">
						<h3 class="text-sm font-semibold text-foreground">{section.category}</h3>
						<div class="space-y-2">
							{#each section.items as shortcut}
								<div class="flex items-center justify-between text-sm">
									<span class="text-muted-foreground">{shortcut.description}</span>
									<div class="flex items-center gap-1">
										{#each shortcut.keys as key, kindex}
											<kbd
												class="rounded-sm border bg-muted px-2 py-0.5 font-mono text-xs font-semibold"
											>
												{key}
											</kbd>
											{#if kindex < shortcut.keys.length - 1}
												<span class="text-xs text-muted-foreground">+</span>
											{/if}
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>

			<button
				class="absolute top-4 right-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:outline-none"
				onclick={() => (open = false)}
				aria-label="Close"
			>
				<X class="h-4 w-4" />
			</button>
		</div>
	</div>
{/if}
