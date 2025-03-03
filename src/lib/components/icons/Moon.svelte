<script lang="ts">
  export let size = 20;
  export let strokeWidth = 2;
  export let className: string | undefined = undefined;
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg" 
  width={size} 
  height={size} 
  viewBox="0 0 24 24" 
  fill="none" 
  stroke="currentColor" 
  stroke-width={strokeWidth} 
  stroke-linecap="round" 
  stroke-linejoin="round" 
  class={className}
>
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
</svg> 