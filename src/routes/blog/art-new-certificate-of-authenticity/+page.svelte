<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  
  // Get the current URL for sharing
  let articleUrl = "";
  let articleTitle = "ART: The New Certificate of Authenticity / Digital COA";
  
  // When the component mounts, get the current URL
  import { onMount } from 'svelte';
  
  onMount(() => {
    if (typeof window !== 'undefined') {
      articleUrl = encodeURIComponent(window.location.href);
    }
  });
</script>

<div class="container mx-auto px-4 max-w-4xl md:pb-10">
  <article class="md:mb-12 pt-12 md:pt-20">
    <div class="mb-10 border-b border-border pb-6">
      <div class="flex items-center mb-4 text-sm text-muted-foreground">
        <span class="inline-block bg-primary/10 text-primary px-3 py-1 rounded-full">May 15, 2023</span>
        <span class="mx-2">•</span>
        <span>ARC Team</span>
      </div>
      <h1 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">ART: The New Certificate of Authenticity / Digital COA</h1>
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
      <p class="mb-6">
        For centuries, the Certificate of Authenticity (COA) has been the cornerstone of proving an artwork's legitimacy. Whether issued by an artist, gallery, or expert, the COA has long been the industry's default tool for verifying provenance. But as the art world grows increasingly digital and global, this antiquated system is proving insufficient—too easily forged, lost, or disconnected from the artwork itself. The need for a more secure, immutable, and artist-driven solution has never been greater. Enter <strong>ART (Artwork Registry Token)</strong>—a blockchain-based evolution of the COA that transforms the way we document and authenticate physical artworks.
      </p>

      <h2 class="font-semibold text-xl mb-4">The Problem with Traditional COAs</h2>
      
      <p class="mb-4">
        Traditional Certificates of Authenticity suffer from several critical flaws:
      </p>
      
      <ul class="list-disc pl-4 space-y-1 mb-6">
        <li><strong>Forgery & Fraud</strong> – Paper COAs are easily counterfeited, making art authentication an ongoing challenge.</li>
        <li><strong>Loss & Disconnection</strong> – A physical COA can be lost, stolen, or separated from the artwork, rendering it useless.</li>
        <li><strong>Gatekeeping & Exclusivity</strong> – Authenticity is often controlled by centralized institutions, which can be opaque and inaccessible.</li>
        <li><strong>Lack of Provenance Tracking</strong> – Most COAs are static documents that don't evolve with the artwork's history.</li>
      </ul>
      
      <p class="mb-6">
        With these vulnerabilities, collectors, institutions, and artists have long sought a better way to document and verify authenticity without relying on subjective or centralized authorities.
      </p>

      <h2 class="font-semibold text-xl mb-4">What is an ART?</h2>
      
      <p class="mb-4">
        The <strong>Artwork Registry Token (ART)</strong> is a digital provenance record that replaces the COA with a transparent, immutable, and artist-controlled system. Unlike traditional COAs, ARTs live on the blockchain, making them permanent, secure, and verifiable by anyone.
      </p>
      
      <p class="mb-4">
        Each ART contains:
      </p>
      
      <ul class="list-disc pl-4 space-y-1 mb-6">
        <li><strong>Artist & Artwork Details</strong> – Directly issued by the artist, ensuring authenticity from the source.</li>
        <li><strong>Ownership & Provenance</strong> – A dynamic, on-chain record of past and present ownership.</li>
        <li><strong>Exhibition & Sales History</strong> – Essential documentation that evolves with the artwork.</li>
        <li><strong>Certification Method</strong> – Directly linking the physical artwork to its digital record through NFC chips, QR codes, or inscriptions.</li>
      </ul>

      <h2 class="font-semibold text-xl mb-4">Why ART is the Future of Authentication</h2>
      
      <ol class="list-decimal pl-4 space-y-3 mb-6">
        <li>
          <strong>Immutable & Tamper-Proof</strong><br>
          Blockchain ensures that once an ART is created, its history cannot be altered, eliminating forgery and fraud.
        </li>
        
        <li>
          <strong>Artist-Owned & Decentralized</strong><br>
          Unlike traditional COAs that require third-party validation, ARTs are minted directly by artists within their own registry. This guarantees authenticity at the source and removes institutional gatekeeping.
        </li>
        
        <li>
          <strong>Seamless Provenance Tracking</strong><br>
          Every time an artwork is exhibited, sold, or transferred, the ART can be updated to reflect its evolving history—ensuring a complete, verifiable record.
        </li>
        
        <li>
          <strong>Interoperable & Global</strong><br>
          ARTs work across multiple blockchain networks and platforms, making them universally accessible to collectors, galleries, and museums.
        </li>
      </ol>

      <h2 class="font-semibold text-xl mb-4">The End of Paper COAs</h2>
      
      <p class="mb-4">
        For too long, art authentication has relied on outdated, unreliable methods. With the introduction of ARTs, the industry now has a system that is <strong>secure, transparent, and artist-driven</strong>. As the art world embraces blockchain technology, ARTs will become the new standard—ensuring that provenance is no longer a privilege of institutions but a right of every artist and collector.
      </p>
      
      <p class="mb-4">
        <strong>The future of authenticity is here. The future is ART.</strong>
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