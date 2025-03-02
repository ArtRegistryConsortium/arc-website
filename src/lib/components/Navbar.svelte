<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<nav class="fixed top-0 left-0 right-0 py-4 px-4 flex items-center border-b border-gray-100 bg-white z-10">
  <div class="font-semibold flex-1">Art Registry Consortium</div>
  
  <div class="hidden md:flex space-x-8 flex-1 justify-center">
    <a href="/standard" class="hover:text-gray-600">The Standard</a>
    <a href="/registry" class="hover:text-gray-600">Registry</a>
    <a href="/about" class="hover:text-gray-600">About</a>
    <a href="/contact" class="hover:text-gray-600">Contact</a>
  </div>
  
  <div class="flex-1 flex justify-end">
    <Button class="bg-black text-white hover:bg-gray-800">Sign In</Button>
  </div>
</nav> 