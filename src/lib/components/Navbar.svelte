<script lang="ts">
  import { Button } from "../components/ui/button/index.js";
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import WalletConnectButton from './WalletConnectButton.svelte';
  import { setupStatusStore, getSetupRedirectUrl } from '../stores/setupStatus';
  import { walletAuthStore } from '../stores/walletAuth';
  import { setUserClosedActivatePage } from '../stores/navigationState';

  let mobileMenuOpen = false;
  let isAuthenticated = false;
  let setupStatus: import('../services/walletService').WalletSetupStatus | null = null;

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  // Close mobile menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (mobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
      mobileMenuOpen = false;
    }
  }

  // Function to handle complete setup button click
  function handleCompleteSetup() {
    if (setupStatus) {
      // Reset the flag to allow redirection to activate pages
      setUserClosedActivatePage(false);

      const redirectUrl = getSetupRedirectUrl(setupStatus);
      goto(redirectUrl);
    }
  }

  onMount(() => {
    document.addEventListener('click', handleClickOutside);

    // Subscribe to wallet auth store
    const unsubscribeAuth = walletAuthStore.subscribe(state => {
      isAuthenticated = state.isVerified;
    });

    // Subscribe to setup status store
    const unsubscribeSetup = setupStatusStore.subscribe(state => {
      setupStatus = state.status;
    });

    return () => {
      document.removeEventListener('click', handleClickOutside);
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeSetup) unsubscribeSetup();
    };
  });
</script>

<nav class="fixed top-0 left-0 right-0 py-3 md:py-4 px-4 md:px-6 flex items-center border-b border-border bg-white dark:bg-[#09090b] backdrop-blur-sm z-10 transition-all duration-200">
  <div class="font-extrabold flex-1 dark:text-white">
    <a href="/" class="hover:text-primary transition-colors duration-200 flex items-center">
      Art Registry Consortium
    </a>
  </div>

  <!-- Desktop Navigation -->
  <div class="hidden md:flex space-x-1 lg:space-x-2 flex-1 justify-center">
    <a
      href="/registry"
      class="px-3 py-2 rounded-md whitespace-nowrap hover:text-primary transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
      class:active={$page.url.pathname === '/registry'}
    >
      Registry
    </a>
    <a
      href="/standard"
      class="px-3 py-2 rounded-md whitespace-nowrap hover:text-primary transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
      class:active={$page.url.pathname === '/standard'}
    >
      The Standard
    </a>
    <a
      href="/blog"
      class="px-3 py-2 rounded-md whitespace-nowrap hover:text-primary transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
      class:active={$page.url.pathname.startsWith('/blog')}
    >
      Blog
    </a>
    <a
      href="/about"
      class="px-3 py-2 rounded-md whitespace-nowrap hover:text-primary transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
      class:active={$page.url.pathname === '/about'}
    >
      About
    </a>
    <a
      href="/faq"
      class="px-3 py-2 rounded-md whitespace-nowrap hover:text-primary transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
      class:active={$page.url.pathname === '/faq'}
    >
      FAQ
    </a>
    <a
      href="/contact"
      class="px-3 py-2 rounded-md whitespace-nowrap hover:text-primary transition-colors duration-200 dark:text-gray-300 dark:hover:text-white"
      class:active={$page.url.pathname === '/contact'}
    >
      Contact
    </a>
  </div>

  <div class="flex-1 flex justify-end items-center space-x-4">
    <!-- Mobile Menu Button -->
    <button
      class="md:hidden mobile-menu-button p-2 rounded-md hover:bg-muted transition-colors duration-200 focus:outline-none"
      on:click={toggleMobileMenu}
      aria-label="Toggle mobile menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {#if mobileMenuOpen}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        {/if}
      </svg>
    </button>

    <!-- Wallet Connect Button or Complete Setup Button -->
    {#if isAuthenticated && setupStatus && !setupStatus.setup_completed}
      <Button variant="default" class="shadow-sm" on:click={handleCompleteSetup}>
        <div class="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          Complete Setup
        </div>
      </Button>
    {:else}
      <WalletConnectButton />
    {/if}
  </div>
</nav>

<!-- Mobile Menu Dropdown -->
{#if mobileMenuOpen}
  <div class="md:hidden fixed top-16 left-0 right-0 bg-white/95 dark:bg-[#09090b]/95 backdrop-blur-sm border-b border-border z-10 mobile-menu shadow-lg">
    <div class="flex flex-col py-4 px-4 space-y-1">
      <a
        href="/registry"
        on:click={closeMobileMenu}
        class="py-3 px-4 hover:text-primary rounded-md dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
        class:active={$page.url.pathname === '/registry'}
      >
        Registry
      </a>
      <a
        href="/standard"
        on:click={closeMobileMenu}
        class="py-3 px-4 hover:text-primary rounded-md dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
        class:active={$page.url.pathname === '/standard'}
      >
        The Standard
      </a>
      <a
        href="/blog"
        on:click={closeMobileMenu}
        class="py-3 px-4 hover:text-primary rounded-md dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
        class:active={$page.url.pathname.startsWith('/blog')}
      >
        Blog
      </a>
      <a
        href="/about"
        on:click={closeMobileMenu}
        class="py-3 px-4 hover:text-primary rounded-md dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
        class:active={$page.url.pathname === '/about'}
      >
        About
      </a>
      <a
        href="/faq"
        on:click={closeMobileMenu}
        class="py-3 px-4 hover:text-primary rounded-md dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
        class:active={$page.url.pathname === '/faq'}
      >
        FAQ
      </a>
      <a
        href="/contact"
        on:click={closeMobileMenu}
        class="py-3 px-4 hover:text-primary rounded-md dark:text-gray-300 dark:hover:text-white transition-colors duration-200"
        class:active={$page.url.pathname === '/contact'}
      >
        Contact
      </a>
    </div>
  </div>
{/if}

<style>
  a.active {
    color: hsl(var(--primary));
    text-decoration: underline;
    text-underline-offset: 6px;
    text-decoration-thickness: 2px;
    font-weight: 500;
  }
</style>
