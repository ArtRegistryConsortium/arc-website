<script>
  // Empty layout to prevent inheriting the root layout with navbar and footer
  let { children } = $props();
</script>

<div>
  {@render children()}
</div> 