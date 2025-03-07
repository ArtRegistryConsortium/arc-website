<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { onMount } from 'svelte';
	
	// Import the theme store to initialize it
	import { themeStore } from '$lib/stores/theme';
	
	let { children } = $props();
	
	// This import is needed to initialize the theme
	// The store subscription will handle the theme changes
	onMount(() => {
		// Force a theme update on mount
		themeStore.update(theme => theme);
	});

	injectSpeedInsights();
	injectAnalytics();
</script>

<div class="min-h-screen flex flex-col">
	<Navbar />
	<main class="flex-grow pt-16 md:pt-19">
		{@render children()}
	</main>
	<Footer />
	
</div>
