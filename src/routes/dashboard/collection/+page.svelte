<script lang="ts">
  import { Card } from '$lib/components/ui/card/index.js';
</script>

<div class="space-y-8 min-h-screen">
  <h1 class="text-2xl font-bold">My Collection</h1>

  <Card class="p-8">
    <div class="flex flex-col items-center justify-center space-y-6 py-12">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3 class="text-xl font-medium">My Collection Coming Soon</h3>
      <p class="text-gray-500 dark:text-gray-400 text-center max-w-md">
        The My Collection feature is currently under development.
        This will allow collectors to manage and showcase their art collection with verified provenance.
      </p>
    </div>
  </Card>
</div>
