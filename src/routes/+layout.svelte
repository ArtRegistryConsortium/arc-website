<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import DevelopmentBanner from '$lib/components/DevelopmentBanner.svelte';
	import { injectAnalytics } from '@vercel/analytics/sveltekit'
	import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	import Web3Provider from '../lib/components/Web3Provider.svelte';

	// Import the theme and font stores to initialize them
	import { themeStore } from '../lib/stores/theme';
	import { fontStore } from '../lib/stores/font';
	// Import wallet and setup stores
	import { walletAuthStore } from '../lib/stores/walletAuth';
	import { setupStatusStore, getSetupRedirectUrl } from '../lib/stores/setupStatus';
	import { navigationState, resetNavigationState } from '../lib/stores/navigationState';

	let { children, data } = $props();
	let isAuthenticated = false;
	let setupStatus = null;
	let isRedirecting = false;
	let userClosedActivatePage = false;

	// This import is needed to initialize the theme
	// The store subscription will handle the theme changes
	onMount(() => {
		// Force a theme and font update on mount
		themeStore.update(theme => theme);
		fontStore.update(font => font);
	});

	// Subscribe to stores and handle redirects
	let unsubscribeAuth: () => void;
	let unsubscribeSetup: () => void;
	let unsubscribeNavigation: () => void;

	onMount(() => {
		// Reset isRedirecting flag after a short delay to prevent redirect loops
		setTimeout(() => {
			isRedirecting = false;
			console.log('Reset isRedirecting flag');
		}, 1000);

		// Subscribe to wallet auth store
		unsubscribeAuth = walletAuthStore.subscribe(state => {
			isAuthenticated = state.isVerified;
		});

		// Subscribe to navigation state store
		unsubscribeNavigation = navigationState.subscribe(state => {
			userClosedActivatePage = state.userClosedActivatePage;
			console.log('Navigation state updated in root layout:', state);
		});

		// Subscribe to setup status store
		unsubscribeSetup = setupStatusStore.subscribe(state => {
			setupStatus = state.status;

			// Check if we need to redirect based on setup status
			console.log('Checking redirect conditions:', {
				isAuthenticated,
				setupCompleted: setupStatus?.setup_completed,
				isRedirecting,
				userClosedActivatePage,
				currentPath: window.location.pathname
			});

			if (isAuthenticated && setupStatus && !setupStatus.setup_completed && !isRedirecting && !userClosedActivatePage) {
				// Don't redirect if we're already on an activate page
				if (!data?.skipLayout && !window.location.pathname.startsWith('/activate')) {
					// Get the appropriate redirect URL based on setup step
					const redirectUrl = getSetupRedirectUrl(setupStatus);
					console.log('Redirecting to setup page:', redirectUrl);
					isRedirecting = true;
					goto(redirectUrl);
				} else {
					console.log('Not redirecting: already on activate page or layout should be skipped');
				}
			} else {
				console.log('Not redirecting: conditions not met');
			}
		});
	});

	onDestroy(() => {
		if (unsubscribeAuth) unsubscribeAuth();
		if (unsubscribeSetup) unsubscribeSetup();
		if (unsubscribeNavigation) unsubscribeNavigation();
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
			<main class="flex-grow pt-16 md:pt-19 ">
				{@render children()}
			</main>
			<Footer />
			<DevelopmentBanner />
		</div>
	{/if}
</Web3Provider>
