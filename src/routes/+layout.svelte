<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	
	let { children } = $props();
</script>

<div class="min-h-screen flex flex-col">
	<Navbar />
	<main class="flex-grow pt-16">
		{@render children()}
	</main>
</div>
