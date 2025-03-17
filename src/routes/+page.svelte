<script lang="ts">
    import { Button } from "$lib/components/ui/button/index.js";
    import { onMount } from 'svelte';
</script>

<div class="min-h-screen">
  <!-- Hero Section with Gradient Background -->
  <section class="py-16 md:py-24 bg-muted/30 dark:bg-muted/10 border-y border-muted relative">
    <div class="absolute inset-0  to-accent/20 dark:from-primary/10 dark:to-accent/30 "></div>
    <div class="container mx-auto px-4 relative py-9 md:py-24 ">
      <div class=" mx-auto text-center">
        <h1 class="text-4xl sm:text-4xl md:text-6xl font-extrabold mb-6 bg-clip-text leading-tight text-transparent bg-gradient-to-r from-primary to-primary/80 dark:from-primary dark:to-primary/90">
          A New Standard for Art Documentation
        </h1>
        <p class="text-lg md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto text-muted-foreground dark:text-gray-300">
          ARC brings transparency, authenticity, and permanence to physical art records through blockchain technology.
        </p>
        <div class="flex justify-center">
          <Button class="px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg">
            <a href="https://discord.com/invite/kNmQCnNWSp" class="no-underline">Join the ARC Consortium on Discord</a>
          </Button>
        </div>
        
      </div>
    </div>
  </section>

  <!-- Introduction Section -->
  <section class="py-16 md:py-24 border-t border-muted relative">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl mx-auto">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-8 md:mb-10">Introduction to ARC</h2>
        <p class="text-lg text-center leading-relaxed text-muted-foreground dark:text-gray-300">
          The Art Registry Consortium (ARC) is an open standard designed to document, verify, and manage the 
          provenance of physical artworks on the blockchain.
        </p>
      </div>
    </div>
  </section>

  <!-- Key Features Section with Icons -->
  <section class="py-16 md:py-24 bg-muted/30 dark:bg-muted/10 border-y border-muted relative">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">Key Features</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- Feature 1 -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border/50">
          <div class="flex items-start mb-4">
            <h3 class="text-xl font-semibold">Decentralized & Secure</h3>
          </div>
          <p class="text-muted-foreground dark:text-gray-300">Immutable provenance tracking for artworks, ensuring authenticity and preventing fraud.</p>
        </div>
        
        <!-- Feature 2 -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border/50">
          <div class="flex items-start mb-4">
            <h3 class="text-xl font-semibold">Artist-Owned Contracts</h3>
          </div>
          <p class="text-muted-foreground dark:text-gray-300">Each artist deploys their own contract, maintaining full control over their catalogue raisonné.</p>
        </div>
        
        <!-- Feature 3 -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border/50">
          <div class="flex items-start mb-4">
            <h3 class="text-xl font-semibold">Identity Management</h3>
          </div>
          <p class="text-muted-foreground dark:text-gray-300">Robust identity system for artists, galleries, institutions, and collectors with role-based access control.</p>
        </div>
        
        <!-- Feature 4 -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border/50">
          <div class="flex items-start mb-4">
            <h3 class="text-xl font-semibold">Evolving Documentation</h3>
          </div>
          <p class="text-muted-foreground dark:text-gray-300">Update exhibition history, bibliographies, and ownership over time while maintaining a verifiable record.</p>
        </div>
        
        <!-- Feature 5 -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border/50">
          <div class="flex items-start mb-4">
            <h3 class="text-xl font-semibold">Gallery & Collector Tools</h3>
          </div>
          <p class="text-muted-foreground dark:text-gray-300">Verify authenticity and track provenance with ease using our specialized tools for the art market.</p>
        </div>
        
        <!-- Feature 6 -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 border border-border/50">
          <div class="flex items-start mb-4">
            <h3 class="text-xl font-semibold">Royalty Management</h3>
          </div>
          <p class="text-muted-foreground dark:text-gray-300">Built-in support for artist royalties on secondary sales with EIP-2981 compliance, ensuring artists benefit from future transactions.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="py-16 md:py-24 relative">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">How It Works</h2>
      
      <div class="max-w-4xl mx-auto">
        <div class="relative">
          <!-- Step 1 -->
          <div class="flex flex-col md:flex-row items-start mb-12 relative">
            <div class="flex-shrink-0 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">1</div>
            <div class="hidden md:block w-0.5 h-full bg-border absolute left-5 top-10 -z-10"></div>
            <div class="md:ml-8 mt-4 md:mt-0">
              <h3 class="text-xl font-semibold mb-2">Create Your Identity</h3>
              <p class="text-muted-foreground dark:text-gray-300">Register your identity in the ARC system, establishing your profile as an artist, gallery, institution, or collector.</p>
            </div>
          </div>
          
          <!-- Step 2 -->
          <div class="flex flex-col md:flex-row items-start mb-12 relative">
            <div class="flex-shrink-0 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">2</div>
            <div class="hidden md:block w-0.5 h-full bg-border absolute left-5 top-10 -z-10"></div>
            <div class="md:ml-8 mt-4 md:mt-0">
              <h3 class="text-xl font-semibold mb-2">Deploy Your Catalogue Raisonné (Contract)</h3>
              <p class="text-muted-foreground dark:text-gray-300">As an artist, deploy your personalized ARC contract to establish your digital catalogue raisonné on the blockchain.</p>
            </div>
          </div>
          
          <!-- Step 3 -->
          <div class="flex flex-col md:flex-row items-start mb-12 relative">
            <div class="flex-shrink-0 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">3</div>
            <div class="hidden md:block w-0.5 h-full bg-border absolute left-5 top-10 -z-10"></div>
            <div class="md:ml-8 mt-4 md:mt-0">
              <h3 class="text-xl font-semibold mb-2">Mint Your Artwork Registry Tokens (ARTs)</h3>
              <p class="text-muted-foreground dark:text-gray-300">Permanently link physical works to digital records, creating a verifiable connection between the physical and digital worlds.</p>
            </div>
          </div>
          
          <!-- Step 4 -->
          <div class="flex flex-col md:flex-row items-start relative">
            <div class="flex-shrink-0 bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg">4</div>
            <div class="md:ml-8 mt-4 md:mt-0">
              <h3 class="text-xl font-semibold mb-2">Evolve & Verify</h3>
              <p class="text-muted-foreground dark:text-gray-300">Update documentation, verify authenticity, and track provenance throughout the artwork's lifecycle.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- The Standard Section -->
  <section class="py-16 md:py-24 bg-muted/30 dark:bg-muted/10 border-y border-muted relative">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-8 md:mb-10">The Standard</h2>
        <p class="text-lg mb-8 md:mb-10 text-muted-foreground dark:text-gray-300">
          Learn how to properly document and authenticate your physical artworks using the ARC 
          standard, including best practices for the ART Stamp.
        </p>
        <Button variant="outline" class="px-6 py-5 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
          <a href="/standard" class="flex items-center">
            <span>Explore the Standard</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>
        </Button>
      </div>
    </div>
  </section>

  <!-- Who It's For Section -->
  <section class="py-16 md:py-24 relative">
    <div class="container mx-auto px-4">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 md:mb-16">Who It's For</h2>
      
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <!-- Artists -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-center border border-border/50 hover:border-primary/30">
          <h3 class="text-xl font-semibold mb-2">Artists</h3>
          <p class="text-muted-foreground dark:text-gray-300">Maintain and control your catalogue raisonné with complete autonomy.</p>
        </div>
        
        <!-- Galleries -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-center border border-border/50 hover:border-primary/30">
          <h3 class="text-xl font-semibold mb-2">Galleries</h3>
          <p class="text-muted-foreground dark:text-gray-300">Authenticate and support artists' work with verifiable provenance.</p>
        </div>
        
        <!-- Collectors -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-center border border-border/50 hover:border-primary/30">
          <h3 class="text-xl font-semibold mb-2">Collectors</h3>
          <p class="text-muted-foreground dark:text-gray-300">Verify ownership and provenance with confidence and security.</p>
        </div>
        
        <!-- Institutions -->
        <div class="bg-background dark:bg-background/5 p-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 text-center border border-border/50 hover:border-primary/30">
          <h3 class="text-xl font-semibold mb-2">Institutions</h3>
          <p class="text-muted-foreground dark:text-gray-300">Preserve art records for future generations with blockchain permanence.</p>
        </div>
      </div>
    </div>
  </section>

  <!-- Contribute Section -->
  <section class="py-16 md:py-24 bg-muted/30 dark:bg-muted/10 border-y border-muted relative">
    <div class="container mx-auto px-4">
      <div class="max-w-3xl mx-auto text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-8 md:mb-10">Contribute</h2>
        <p class="text-lg mb-8 md:mb-10 text-muted-foreground dark:text-gray-300">
          Be part of the future of art documentation. Join our community of artists, galleries, collectors, and institutions.
        </p>
        <Button class="px-6 py-5 shadow-lg hover:shadow-xl transition-all duration-300">
          <a href="https://discord.com/invite/kNmQCnNWSp" target="_blank" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3847-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
            </svg>
            Join the Discussion on Discord
          </a>
        </Button>
      </div>
    </div>
  </section>
</div>

