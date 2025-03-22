<script lang="ts">
  import { goto } from '$app/navigation';

  export let currentStep: number;

  // Define the steps with their routes
  const steps = [
    { number: 1, label: "Payment", route: "/activate" },
    { number: 2, label: "Identity Type", route: "/activate/choose-identity-type" },
    { number: 3, label: "Identity Data", route: "/activate/identity-data" },
    { number: 4, label: "Select Chain", route: "/activate/select-chain" },
    { number: 5, label: "Confirmation", route: "/activate/confirmation" }
  ];

  // Map the setup_step (0-4) to the UI step (1-5)
  // This ensures the UI shows the correct step based on the database value
  // 0: Payment (UI: 1)
  // 1: Identity Type (UI: 2)
  // 2: Identity Data (UI: 3)
  // 3: Select Chain (UI: 4)
  // 4: Confirmation (UI: 5)

  // Calculate the progress percentage based on the current step
  // For step 1, progress is 0%
  // For step 5, progress is 100%
  // Steps in between are evenly distributed
  const progressPercentage = (currentStep - 1) / (steps.length - 1) * 100;

  // Function to handle step click
  function handleStepClick(step: any) {
    // Don't allow going back to payment step
    if (step.number === 1) {
      return;
    }

    // Only allow clicking on steps that have been completed or the current step
    // This prevents users from skipping ahead to steps they haven't reached yet
    if (step.number <= currentStep) {
      goto(step.route);
    }
  }
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
        class="absolute left-0 h-0.5 right-0 top-1/2 -translate-y-1/2 bg-primary transition-all duration-300"
        style="width: {Math.max(0, progressPercentage-3)}%; margin-top: -11px;
    margin-right: 1px; margin-left: 2px;"
      ></div>

      <!-- Step circles -->
      {#each steps as step}
        <div class="relative flex flex-col items-center">
          <button
            on:click={() => handleStepClick(step)}
            class="w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors z-10
            {currentStep >= step.number ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}
            {step.number <= currentStep && step.number !== 1 ? 'cursor-pointer' : 'cursor-default'}"
            disabled={step.number > currentStep || step.number === 1}
            aria-label={`Go to ${step.label} step`}
            title={step.number === 1 ? 'Cannot return to payment step' :
                  step.number > currentStep ? 'Complete previous steps first' :
                  `Go to ${step.label}`}
          >

            {step.number}
          </button>
          <span
            class="text-xs text-center mt-2
            {currentStep >= step.number ? 'text-primary font-medium' : 'text-muted-foreground'}
            {step.number <= currentStep && step.number !== 1 ? 'cursor-pointer' : ''}"
            on:click={() => handleStepClick(step)}
            role={step.number <= currentStep && step.number !== 1 ? 'button' : 'none'}
            title={step.number === 1 ? 'Cannot return to payment step' :
                  step.number > currentStep ? 'Complete previous steps first' :
                  `Go to ${step.label}`}
          >
            {step.label}
          </span>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  /* Custom styles can be added here if needed in the future */
</style>
