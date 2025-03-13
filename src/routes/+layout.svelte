<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { onMount } from 'svelte';
	import Web3Provider from '$lib/components/Web3Provider.svelte';
	
	// Import the theme store to initialize it
	import { themeStore } from '$lib/stores/theme';
	
	let { children, data } = $props();
	
	// This import is needed to initialize the theme
	// The store subscription will handle the theme changes
	onMount(() => {
		// Force a theme update on mount
		themeStore.update(theme => theme);
	});

	injectSpeedInsights();
	injectAnalytics();
</script>

<Web3Provider>
	{#if data?.skipLayout}
		<div class="min-h-screen">
			{@render children()}
		</div>
	{:else}
		<div class="min-h-screen flex flex-col">
			<Navbar />
			<main class="flex-grow pt-16 md:pt-19">
				{@render children()}
			</main>
			<Footer />
		</div>
	{/if}
</Web3Provider>
