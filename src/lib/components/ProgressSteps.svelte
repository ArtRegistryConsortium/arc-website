<script lang="ts">
  export let currentStep: number;

  // Define the steps
  const steps = [
    { number: 1, label: "Payment" },
    { number: 2, label: "Identity Type" },
    { number: 3, label: "Create Identity" },
    { number: 4, label: "Select Chain" },
    { number: 5, label: "Confirmation" }
  ];
</script>

<div class="hidden md:block w-full max-w-2xl mb-16">
  <!-- Progress bar container with relative positioning -->
  <div class="relative">
    <!-- Step circles and connecting lines -->
    <div class="flex items-center justify-between">
      <!-- Background line that spans the entire width -->
      <div class="absolute left-0 right-0 h-0.5 top-1/2 -translate-y-1/2 bg-muted" style="margin-top: -11px;
    margin-right: 20px; margin-left: 20px;"></div>

      <!-- Completed progress line -->
      <div
        class="absolute left-0 h-0.5 top-1/2 -translate-y-1/2 bg-primary transition-all duration-300"
        style="width: {Math.max(0, (currentStep - 1) / (steps.length - 1) * 100)}%; margin-top: -11px;
    margin-right: 20px; margin-left: 20px;"
      ></div>

      <!-- Step circles -->
      {#each steps as step}
        <div class="relative flex flex-col items-center">
          <div
            class="w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors z-10
            {currentStep >= step.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}"
          >
            {step.number}
          </div>
          <span class="text-xs text-center mt-2 {currentStep >= step.number ? 'text-primary font-medium' : 'text-muted-foreground'}">
            {step.label}
          </span>
        </div>
      {/each}
    </div>
  </div>
</div>
