<script lang="ts">
  import { page } from '$app/stores';
  import { onMount, onDestroy } from 'svelte';
  
  let isMobileMenuOpen = $state(false);
  
  // Function to toggle mobile menu
  function toggleMobileMenu() {
    isMobileMenuOpen = !isMobileMenuOpen;
  }
  
  // Close mobile menu when route changes
  $effect(() => {
    if ($page.url.pathname) {
      isMobileMenuOpen = false;
    }
  });
</script>

<div class="min-h-screen bg-background">
  <!-- Mobile Header - Only visible on small screens -->
  <div class="md:hidden flex items-center justify-between p-4 border-b border-border sticky top-0 z-10 bg-background">
    <h2 class="font-semibold text-gray-800 dark:text-white">Registry</h2>
    <button
      type="button"
      class="p-2 rounded-md hover:bg-muted/50 transition-colors"
      on:click={toggleMobileMenu}
      aria-label="Toggle menu"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {#if isMobileMenuOpen}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        {:else}
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        {/if}
      </svg>
    </button>
  </div>

  <div class="flex md:min-h-[calc(100vh-56px)] md:min-h-screen">
    <!-- Sidebar -->
    <div
      class="bg-background border-r border-border fixed md:sticky md:h-screen z-10 transition-all duration-300 transform
             md:transform-none md:translate-x-0 md:w-72 w-72 top-[65px] md:top-[4.65rem] right-0
             {isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}"
    >
      <div class="p-4 border-b border-border px-6">
        <h2 class="font-semibold text-gray-800 dark:text-white">Registry</h2>
      </div>
      <nav class="mt-4 flex flex-col justify-between md:h-[calc(100%-4rem)]">
        <div>
          <a
            href="/registry/identities"
            class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200 touch-target"
            class:active={$page.url.pathname === '/registry/identities'}
          >
            Identities
          </a>
          <a
            href="/registry/art"
            class="flex items-center px-6 py-3 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-white transition-colors duration-200 touch-target"
            class:active={$page.url.pathname === '/registry/art'}
          >
            ART Tokens
          </a>
        </div>
      </nav>
    </div>

    <!-- Overlay for mobile menu -->
    {#if isMobileMenuOpen}
      <div
        class="fixed inset-0 bg-black/20 dark:bg-black/50 z-10 md:hidden"
        on:click={toggleMobileMenu}
        aria-hidden="true"
      ></div>
    {/if}

    <!-- Main Content -->
    <div class="flex-1 w-full py-6 md:py-8">
      <div class="p-4 sm:p-6 md:p-8 lg:p-10 md:min-h-screen">
        <slot />
      </div>
    </div>
  </div>
</div>

<style>
  .active {
    color: hsl(var(--primary));
    text-decoration: underline;
    text-underline-offset: 6px;
    text-decoration-thickness: 2px;
    font-weight: 600;
  }
</style>
