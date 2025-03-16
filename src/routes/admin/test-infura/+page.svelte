<script lang="ts">
import { Button } from "$lib/components/ui/button/index.js";
import { onMount } from 'svelte';

let testResults: string[] = [];
let isLoading = false;
let success = false;
let errorMessage = '';

async function testInfuraConnection() {
  try {
    isLoading = true;
    testResults = [];
    success = false;
    errorMessage = '';
    
    const response = await fetch('/api/wallet/test-infura');
    
    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }
    
    const result = await response.json();
    
    success = result.success;
    testResults = result.results || [];
    
    if (!success) {
      errorMessage = result.message || 'Unknown error';
    }
  } catch (error) {
    console.error('Error testing Infura connection:', error);
    errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    success = false;
  } finally {
    isLoading = false;
  }
}

// Run the test on mount
onMount(() => {
  testInfuraConnection();
});
</script>

<div class="container mx-auto py-8 px-4">
  <h1 class="text-3xl font-bold mb-6">Infura Connection Test</h1>
  
  <div class="mb-6">
    <Button 
      on:click={testInfuraConnection}
      disabled={isLoading}
      variant={isLoading ? "outline" : "default"}
    >
      {isLoading ? 'Testing...' : 'Test Infura Connection'}
    </Button>
  </div>
  
  {#if isLoading}
    <div class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  {:else if errorMessage}
    <div class="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
      <p class="font-semibold">Error:</p>
      <p>{errorMessage}</p>
    </div>
  {/if}
  
  {#if testResults.length > 0}
    <div class={`p-4 rounded-md mb-6 ${success ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
      <h2 class="text-xl font-semibold mb-2">Test Results</h2>
      <ul class="space-y-2">
        {#each testResults as result}
          <li>{result}</li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
