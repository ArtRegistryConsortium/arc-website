<script lang="ts">
  import { Card } from '$lib/components/ui/card/index.js';
</script>

<div class="space-y-6 sm:space-y-8 md:min-h-screen">
  <h1 class="text-xl sm:text-2xl font-bold">My Collection</h1>

  <Card class="p-4 sm:p-8">
    <div class="flex flex-col items-center justify-center space-y-6 py-8 sm:py-12 px-2 sm:px-0">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="text-lg sm:text-xl font-medium text-center">My Collection Coming Soon</h3>
      <p class="text-gray-500 dark:text-gray-400 text-center text-sm sm:text-base max-w-md">
        The My Collection feature is currently under development.
        This will allow collectors to manage and showcase their art collection with verified provenance.
      </p>
    </div>
  </Card>
</div>
