<script lang="ts">
	import ChevronUp from "@lucide/svelte/icons/chevron-up";
	import * as Select from "./index.js";
	import { cn } from "$lib/utils.js";
	import type { ScrollButtonProps } from "$lib/types.js";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: ScrollButtonProps = $props();
</script>

<Select.ScrollUpButton
	bind:ref
	class={cn("flex cursor-default items-center justify-center py-1", className)}
	{...restProps}
>
	<ChevronUp class="size-4" />
</Select.ScrollUpButton>
