<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  
  // Get the current URL for sharing
  let articleUrl = "";
  let articleTitle = "The Problem with Art Documentation: Closed, Confusing, and Exclusive";
  
  // When the component mounts, get the current URL
  import { onMount } from 'svelte';
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      articleUrl = encodeURIComponent(window.location.href);
    }
  });
</script>

<div class="container mx-auto px-4 max-w-4xl pb-8 md:pb-10">
  <article class="md:mb-12 pt-12 md:pt-20">
    <div class="mb-10 border-b border-border pb-6">
      <div class="flex items-center mb-4 text-sm text-muted-foreground">
        <span class="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full">May 5, 2025</span>
        <span class="mx-2">•</span>
        <span>ARC Team</span>
      </div>
      <h1 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">The Problem with Art Documentation: Closed, Confusing, and Exclusive</h1>
      <div class="flex items-center gap-4 mb-4">
        <Button variant="outline" size="sm">
          <a href="/blog" class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Blog
          </a>
        </Button>
        <div class="flex gap-2">
          <a 
            href={`https://x.com/intent/tweet?url=${articleUrl}&text=${encodeURIComponent(articleTitle + " - ARC Blog")}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            class="text-muted-foreground hover:text-primary" 
            aria-label="Share on X (Twitter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a 
            href={`https://www.threads.net/intent/post?text=${encodeURIComponent(articleTitle + " - ARC Blog ")}${articleUrl}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            class="text-muted-foreground hover:text-primary" 
            aria-label="Share on Threads"
          >
            <svg aria-label="Threads" width="20" height="20" fill="currentColor" viewBox="0 0 192 192" xmlns="http://www.w3.org/2000/svg"><path class="x19hqcy" d="M141.537 88.9883C140.71 88.5919 139.87 88.2104 139.019 87.8451C137.537 60.5382 122.616 44.905 97.5619 44.745C97.4484 44.7443 97.3355 44.7443 97.222 44.7443C82.2364 44.7443 69.7731 51.1409 62.102 62.7807L75.881 72.2328C81.6116 63.5383 90.6052 61.6848 97.2286 61.6848C97.3051 61.6848 97.3819 61.6848 97.4576 61.6855C105.707 61.7381 111.932 64.1366 115.961 68.814C118.893 72.2193 120.854 76.925 121.825 82.8638C114.511 81.6207 106.601 81.2385 98.145 81.7233C74.3247 83.0954 59.0111 96.9879 60.0396 116.292C60.5615 126.084 65.4397 134.508 73.775 140.011C80.8224 144.663 89.899 146.938 99.3323 146.423C111.79 145.74 121.563 140.987 128.381 132.296C133.559 125.696 136.834 117.143 138.28 106.366C144.217 109.949 148.617 114.664 151.047 120.332C155.179 129.967 155.42 145.8 142.501 158.708C131.182 170.016 117.576 174.908 97.0135 175.059C74.2042 174.89 56.9538 167.575 45.7381 153.317C35.2355 139.966 29.8077 120.682 29.6052 96C29.8077 71.3178 35.2355 52.0336 45.7381 38.6827C56.9538 24.4249 74.2039 17.11 97.0132 16.9405C119.988 17.1113 137.539 24.4614 149.184 38.788C154.894 45.8136 159.199 54.6488 162.037 64.9503L178.184 60.6422C174.744 47.9622 169.331 37.0357 161.965 27.974C147.036 9.60668 125.202 0.195148 97.0695 0H96.9569C68.8816 0.19447 47.2921 9.6418 32.7883 28.0793C19.8819 44.4864 13.2244 67.3157 13.0007 95.9325L13 96L13.0007 96.0675C13.2244 124.684 19.8819 147.514 32.7883 163.921C47.2921 182.358 68.8816 191.806 96.9569 192H97.0695C122.03 191.827 139.624 185.292 154.118 170.811C173.081 151.866 172.51 128.119 166.26 113.541C161.776 103.087 153.227 94.5962 141.537 88.9883ZM98.4405 129.507C88.0005 130.095 77.1544 125.409 76.6196 115.372C76.2232 107.93 81.9158 99.626 99.0812 98.6368C101.047 98.5234 102.976 98.468 104.871 98.468C111.106 98.468 116.939 99.0737 122.242 100.233C120.264 124.935 108.662 128.946 98.4405 129.507Z"></path></svg>
          </a>
        </div>
      </div>
    </div>

    <div class="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-primary prose-p:text-muted-foreground prose-a:text-primary">
      <h2 class="font-semibold text-2xl mb-4">A System Stuck in the Past</h2>
      <p class="mb-6">
        Art documentation has long been a fractured, opaque, and often inaccessible system. In a world where provenance determines value, credibility, and authenticity, the art world remains burdened by outdated methods that favor exclusivity over transparency. Certificates of authenticity, handwritten receipts, institutional trust, and fragmented databases have created a landscape where only a privileged few—auction houses, elite galleries, and a select group of collectors—truly control the narrative of an artwork's history. This system is not only inefficient but also actively harmful to artists, collectors, and institutions seeking clarity in a convoluted space.
      </p>

      <h2 class="font-semibold text-xl mb-4">The Problem with Centralized Art Records</h2>
      
      <h3 class="font-semibold mb-4">1. Exclusive Gatekeeping</h3>
      <p class="mb-4">
        Most provenance records are held by private entities, including auction houses, galleries, and museums. Access to these records is typically restricted, requiring industry connections or substantial financial backing. If an artist or collector wants to verify an artwork's history, they often need to navigate a costly and bureaucratic maze just to retrieve basic information.
      </p>

      <h3 class="font-semibold mb-4">2. Fragmented and Incomplete Information</h3>
      <p class="mb-4">
        Unlike financial markets or digital assets, the art world lacks a unified, standardized system for tracking provenance. An artwork's history may be scattered across multiple sources—gallery records, museum archives, private collections—many of which are never updated or shared. Lost paperwork or missing links in documentation can devalue an artwork, even if its authenticity is unquestionable.
      </p>

      <h3 class="font-semibold mb-4">3. Vulnerability to Fraud and Manipulation</h3>
      <p class="mb-4">
        Forgery and misattribution are persistent problems in the art world, and the current documentation system does little to address them. Since provenance records are often maintained privately, they can be manipulated or even fabricated. The lack of public verification mechanisms has led to countless cases of forged certificates, fake authentication letters, and doctored historical records.
      </p>

      <h3 class="font-semibold mb-4">4. Artists Lack Control Over Their Own Work</h3>
      <p class="mb-6">
        Perhaps the most significant flaw in the current system is that artists—the creators of the work—often have little to no say in how their art is documented or authenticated once it enters the market. Instead, third-party institutions dictate the standards, leaving artists disconnected from their own legacy. This dynamic further reinforces the exclusivity of the art world, benefiting only those who already hold power.
      </p>

      <h2 class="font-semibold text-xl mb-4">A Better Future: Open, Transparent, and Decentralized</h2>
      <p class="mb-4">
        The solution to these problems lies in a <span class="font-semibold">decentralized, artist-controlled registry</span> that allows for open verification and transparent provenance tracking. <span class="font-semibold">Blockchain technology offers a way to document artworks immutably, ensuring that each piece's history is permanently recorded, publicly accessible, and resistant to tampering.</span>
      </p>

      <p class="mb-2">
        A system like <span class="font-semibold">ARC (Art Registry Consortium)</span> offers a radical shift from the status quo by introducing:
      </p>
      <ol class=" list-disc pl-4 space-y-1 mb-6">
        <li><span class="font-semibold">Artist-Owned Documentation</span> – Artists mint their own provenance records and control their catalogues directly.</li>
        <li><span class="font-semibold">Immutable, Public Provenance</span> – Every transaction, sale, and exhibition history is transparently recorded on-chain.</li>
        <li><span class="font-semibold">Interoperability</span> – A unified standard that works across galleries, collectors, and institutions, eliminating the need for redundant and disconnected databases.</li>
        <li><span class="font-semibold">Democratized Access</span> – No more gatekeeping; anyone can verify an artwork's authenticity without relying on closed networks.</li>
      </ol>

      <h2 class="font-semibold text-xl mb-4">The Time for Change is Now</h2>
      <p class="mb-4">
        For too long, the art world has relied on antiquated, exclusionary practices that serve the few while disadvantaging the many. <span class="font-semibold">By adopting open, decentralized documentation, we can create a fairer, more transparent, and artist-centric ecosystem.</span>
      </p>

      <p>
        If you believe in a future where art provenance is no longer a privilege but a right, <span class="font-semibold">join ARC and be part of the transformation.</span>
      </p>
    </div>

    <div class="mt-8 md:mt-16 border-t border-border pt-8">
      <div class="bg-muted p-8 rounded-lg">
        <h3 class="text-xl font-bold mb-4">Join the Movement</h3>
        <p class="mb-6 text-muted-foreground">
          Be part of the transformation in art documentation. Join ARC today and help build a more transparent, accessible future for artists and collectors.
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <Button variant="default" class="w-full sm:w-auto">
            <a href="/work-in-progress" class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Join ARC
            </a>
          </Button>
          <Button variant="outline" class="w-full sm:w-auto">
            <a href="/blog" class="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
              More Articles
            </a>
          </Button>
        </div>
      </div>
    </div>
  </article>
</div> 