<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  
  let mobileMenuOpen = false;
  
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
  
  onMount(() => {
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

<nav class="fixed top-0 left-0 right-0 py-4 px-4 flex items-center border-b border-border bg-white dark:bg-[#09090b] z-10">
  <div class="font-extrabold flex-1 dark:text-white">
    <a href="/" class="hover:text-gray-600 dark:hover:text-gray-300">Art Registry Consortium</a>
  </div>
  
  <!-- Desktop Navigation -->
  <div class="hidden md:flex space-x-8 flex-1 justify-center">
    <a href="/registry" class="hover:text-gray-600 dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/registry'}>Registry</a>
    <a href="/standard" class="hover:text-gray-600 dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/standard'}>The Standard</a>
    <a href="/about" class="hover:text-gray-600 dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/about'}>About</a>
    <a href="/faq" class="hover:text-gray-600 dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/faq'}>FAQ</a>
    <a href="/contact" class="hover:text-gray-600 dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/contact'}>Contact</a>
  </div>
  
  <div class="flex-1 flex justify-end items-center space-x-4">
    <!-- Mobile Menu Button -->
    <button 
      class="md:hidden mobile-menu-button p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none" 
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
    
    <Button>Sign In</Button>
  </div>
</nav>

<!-- Mobile Menu Dropdown -->
{#if mobileMenuOpen}
  <div class="md:hidden fixed top-16 left-0 right-0 bg-white dark:bg-[#09090b] border-b border-border z-10 mobile-menu shadow-lg">
    <div class="flex flex-col py-4 px-4 space-y-4">
      <a href="/registry" on:click={closeMobileMenu} class="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/registry'}>Registry</a>
      <a href="/standard" on:click={closeMobileMenu} class="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/standard'}>The Standard</a>
      <a href="/about" on:click={closeMobileMenu} class="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/about'}>About</a>
      <a href="/faq" on:click={closeMobileMenu} class="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/faq'}>FAQ</a>
      <a href="/contact" on:click={closeMobileMenu} class="py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md dark:text-gray-300 dark:hover:text-white" class:active={$page.url.pathname === '/contact'}>Contact</a>
    </div>
  </div>
{/if} 

<style>
  a.active {
    text-decoration: underline;
    text-underline-offset: 4px;
  }
</style> 