<script lang="ts">
  import { onMount } from 'svelte';
  
  export let sections: { id: string; title: string }[] = [];
  export let offset: number = 149; // Offset for scrolling to account for fixed headers
  
  let activeSection: string = '';
  let mounted = false;
  
  onMount(() => {
    // Set up intersection observer to detect which section is currently in view
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            activeSection = entry.target.id;
          }
        });
      },
      {
        rootMargin: `-${offset}px 0px -60% 0px`,
        threshold: 0
      }
    );
    
    // Observe all sections
    sections.forEach(section => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });
    
    mounted = true;
    
    return () => {
      sections.forEach(section => {
        const element = document.getElementById(section.id);
        if (element) observer.unobserve(element);
      });
    };
  });
  
  function scrollToSection(id: string) {
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
</script>

<div class="side-menu hidden 2xl:block">
  <nav class="fixed top-[265px] left-8 transform -translate-y-1/4 bg-background border border-border rounded-lg shadow-sm p-5 w-72">
    <ul class="space-y-3">
      {#each sections as section}
        <li>
          <button
            class="w-full text-left px-4 py-3 rounded-md text-base transition-colors hover:bg-muted {activeSection === section.id ? 'bg-muted font-medium' : ''}"
            on:click={() => scrollToSection(section.id)}
          >
            {section.title}
          </button>
        </li>
      {/each}
    </ul>
  </nav>
</div>

<style>
  .side-menu {
    z-index: 10;
  }
</style> 