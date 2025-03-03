<script lang="ts">
  import ThemeToggle from './ThemeToggle.svelte';
</script>

<footer class="bg-gray-50 dark:bg-[#09090b] border-t border-border py-8 md:py-12 w-full">
  <div class="container mx-auto px-4 max-w-7xl">
    <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
      <div class="col-span-2 sm:col-span-2 md:col-span-1">
        <h3 class="font-semibold text-lg mb-3 md:mb-4 dark:text-white">Art Registry Consortium</h3>
        <p class="text-gray-600 dark:text-gray-300 text-sm">
          Establishing open standards for documenting and tracking physical artworks on the blockchain.
        </p>
      </div>
      
      <div>
        <h3 class="font-semibold text-lg mb-3 md:mb-4 dark:text-white">Resources</h3>
        <ul class="space-y-1 md:space-y-2">
          <li><a href="/registry" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Registry</a></li>
          <li><a href="/standard" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">The Standard</a></li>
          <li><a href="/blog" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Blog</a></li>
          <li><a href="/faq" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">FAQ</a></li>
          <li><a href="/contact" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Contact</a></li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-semibold text-lg mb-3 md:mb-4 dark:text-white">Company</h3>
        <ul class="space-y-1 md:space-y-2">
          <li><a href="/about" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">About</a></li>
          <li><a href="/contact" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Contact</a></li>
          <li><a href="/privacy-policy" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Privacy Policy</a></li>
          <li><a href="/terms-of-service" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Terms of Service</a></li>
        </ul>
      </div>
      
      <div>
        <h3 class="font-semibold text-lg mb-3 md:mb-4 dark:text-white">Connect</h3>
        <ul class="space-y-1 md:space-y-2">
          <li><a href="https://x.com/art_registry_c" target="_blank" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Twitter</a></li>
          <li><a href="https://discord.gg/TFkNXhhP" target="_blank" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">Discord</a></li>
          <li><a href="https://github.com/ArtRegistryConsortium" target="_blank" class="text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white text-sm">GitHub</a></li>
        </ul>
      </div>
    </div>
    
    <div class="border-t border-border mt-8 md:mt-12 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center">
      <p class="text-gray-500 dark:text-gray-400 text-sm">&copy; {new Date().getFullYear()} Art Registry Consortium. All rights reserved.</p>
      <div class="mt-4 md:mt-0">
        <ThemeToggle />
      </div>
    </div>
  </div>
</footer> 