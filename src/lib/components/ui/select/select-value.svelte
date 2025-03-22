<script lang="ts">
  import { Select as SelectPrimitive } from "bits-ui";
  
  let { placeholder = "" } = $props();
</script>

<SelectPrimitive.Value {placeholder} />
