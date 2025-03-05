<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import SideMenu from "$lib/components/SideMenu.svelte";
  
  // Define sections for the side menu
  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "artist-owned-contracts", title: "1. Artist-Owned Contracts" },
    { id: "artwork-registry-token", title: "2. Artwork Registry Token" },
    { id: "art-stamp", title: "3. ART Stamp" },
    { id: "art-follows-artwork", title: "4. ART Follows Artwork" },
    { id: "roles-access-control", title: "5. Roles & Access Control" },
    { id: "why-use-arc", title: "Why Use ARC?" },
    { id: "get-started", title: "Get Started" }
  ];
</script>

<div class="container mx-auto px-4 max-w-4xl md:pb-10 relative">
  <SideMenu {sections} />
  
  <section id="introduction" class="pt-12 md:pt-20">
    <h1 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight mb-6">The Standard</h1>
    <p class="">
      The Art Registry Consortium (ARC) establishes an open standard for documenting and tracking physical 
      artworks on the blockchain. Through artist-owned smart contracts and a modular token system, ARC 
      ensures that each artwork has a secure, standardized, and immutable record of provenance, exhibition 
      history, and ownership.
    </p>
  </section>
  
  <hr class="my-5 md:my-20" />
  <!-- 1. Artist-Owned Contracts -->
  <section id="artist-owned-contracts">
    <h2 class="text-2xl font-bold mb-4">1. Artist-Owned Contracts</h2>
    
    <p class="mb-4">
      Each artist deploys their own ARC contract, giving them full control over their catalog and related ARTs. 
      Artists can update metadata, transfer ownership, and/or permanently retire existing works by using artist 
      dashboard and verify their works.
    </p>

    <div class="bg-muted p-8 rounded-md mb-4">
      <h3 class="font-semibold mb-2">Naming convention:</h3>
      <p class="mb-2">"ARC / Artist Name" (e.g., "ARC / Banksy")</p>
      <p>By maintaining individual contracts, artists retain sovereignty over their body of work while ensuring interoperability across the ARC ecosystem.</p>
    </div>

    <div class="">
      <h3 class="font-semibold mb-2">Registering Existing Contracts</h3>
      <p>
        Artists who have already deployed their own smart contract(s) (e.g., through Manifold) can easily map 
        their existing contract to the ARC registry. This allows artists to maintain their existing contracts while 
        ensuring their artworks benefit from the ARC standard and ecosystem (e.g., working with certified 
        galleries).
      </p>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 2. The Artwork Registry Token (ART) -->
  <section id="artwork-registry-token">
    <h2 class="text-2xl font-bold mb-4">2. The Artwork Registry Token (ART)</h2>
    
    <p class="mb-4">
      Each ART is a unique, blockchain-based record tied to a physical artwork. It contains critical metadata, ensuring traceability, authentication, and provenance tracking.
    </p>
    <div class="bg-muted p-8 rounded-md">
      <h3 class="font-semibold mb-2">ART Fields:</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li><span class="font-semibold">Catalogue Inventory:</span> A unique identifier assigned to the artwork within the artist's personal registry. E.g. CR-2024-01.</li>
        <li><span class="font-semibold">Artist Info:</span> Full name of the artist (or pseudonym) / wallet address.</li>
        <li><span class="font-semibold">Title:</span> The name of the artwork.</li>
        <li><span class="font-semibold">Year of Creation:</span> The year the artwork was completed.</li>
        <li><span class="font-semibold">Medium:</span> Materials used to create the artwork (e.g., "oil on canvas," "bronze sculpture").</li>
        <li><span class="font-semibold">Dimensions:</span> Size of the artwork, listed as height x width x depth (in cm or inches).</li>
        <li><span class="font-semibold">Edition:</span> If the artwork is part of an edition, include the edition number and total editions (e.g., "1/10").</li>
        <li><span class="font-semibold">Series:</span> A label used to group artworks that belong to the same thematic or conceptual body of work. This allows artists to document and organize pieces that are part of a unified vision, making it easier for collectors and institutions to understand the context of each artwork within a larger narrative.</li>
        <li><span class="font-semibold">Image:</span> A high-resolution image or scan of the artwork (optional but recommended).</li>
        <li><span class="font-semibold">Sales Information:</span> Sale price and buyer of the transaction (if applicable).</li>
        <li><span class="font-semibold">Certification Method:</span> How the artwork is linked to the NFT (e.g., NFC chip, QR code, Token ID inscription).</li>
        <li><span class="font-semibold">Exhibition History:</span> List of exhibitions or galleries where the artwork has been shown, including dates and locations.</li>
        <li><span class="font-semibold">Condition Reports:</span> Record of any condition assessments, restorations, or damages.</li>
        <li><span class="font-semibold">Artist Statement:</span> A brief description or intention behind the artwork, written by the artist.</li>
        <li><span class="font-semibold">Bibliography:</span> List of publications, articles, or catalogs where the artwork has been featured, with details such as titles, authors, and page references.</li>
        <li><span class="font-semibold">Keywords or Tags:</span> Themes, styles, or movements related to the artwork (e.g., "surrealism," "landscape").</li>
        <li><span class="font-semibold">Location / Collection:</span> General location or region where the artwork resides (if privacy allows) and the name of the collection.</li>
        <li><span class="font-semibold">Status:</span> Available for sale, not available, etc.</li>
        <li><span class="font-semibold">Note:</span> A flexible field for additional remarks, context, or annotations related to the artwork. This could include restoration notes, collector insights, special dedications, or any other relevant information that does not fit into the predefined fields.</li>
        <li><span class="font-semibold">Royalties:</span> Percentage of resale royalties set by the artist.</li>
      </ol>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 3. The ART Stamp - Linking Physical & Digital -->
  <section id="art-stamp" class="md:mb-12">
    <h2 class="text-2xl font-bold mb-4">3. The ART Stamp – Linking Physical & Digital</h2>
    
    <p class="mb-4">
      To associate an ART with a physical artwork, artists must include an ART Stamp on the piece. This 
      ensures collectors, galleries, and institutions can verify ownership on-chain.
    </p>


    <h3 class="font-semibold mb-2">ART Stamp Format</h3>
    
    <p class="mb-4">
      A label should include the following information: on the back of the artwork or a 
      discreet location:
    </p>

    <div class="bg-muted p-8 rounded-md">
      <p>Artist Name</p>
      <p>Artist Address: [0x...]</p>
      <p>Blockchain: [Ethereum / Arbitrum / Optimism / Base, etc.]</p>
      <p>Contract Address: [0x...]</p>
      <p>Token ID: [ART Token ID]</p>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 4. ART Must Follow the Physical Artwork -->
  <section id="art-follows-artwork" class="md:mb-12">
    <h2 class="text-2xl font-bold mb-4">4. ART Must Follow the Physical Artwork</h2>
    
    <p class="mb-4">
      The ART token is not just a digital certificate—it must reflect the current owner of the physical artwork. When the 
      artwork is sold or changes hands, the ART must be transferred to the new owner's wallet. If the ART is sold or transferred 
      separately from the physical work and becomes separated or fractioned (where that linkage corresponds to the real 
      world piece).
    </p>

    <p>
      For galleries, collectors, and institutions, this means verifying the ART transfer as part of any art sale process. Failure to 
      maintain this link undermines the provenance record and the value of the ART system.
    </p>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 5. Roles & Access Control -->
  <section id="roles-access-control" class="md:mb-12">
    <h2 class="text-2xl font-bold mb-4">5. Roles & Access Control</h2>
    
    <p class="mb-4">
      To ensure proper management of ARTs, ARC contracts implement role-based access control, 
      allowing artists to delegate specific permissions:
    </p>

    <div class="bg-muted p-8 rounded-md">
      <h3 class="font-semibold mb-2">Roles</h3>
      <p class="mb-2"><strong>Contract Owner (Artist) (Per ART Contract)</strong></p>
      <p>The Contract Owner role is assigned to the artist who deploys an ART contract:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can mint ART: Within their own ART contract</li>
        <li>Can update ART: Within their own ART contract</li>
        <li>Can grant/revoke roles: Within their own ART contract</li>
        <li>Can assign a legacy protector: For their ART contract</li>
        <li>Can manage token-specific permissions: For partial editors</li>
        <li>Can set royalties: For their own ART contract and any ART token in their contract</li>
      </ul>

      <p class="mb-2"><strong>Legacy Protector (Per ART Contract)</strong></p>
      <p>The Legacy Protector role is assigned to manage an ART contract when the artist passes away:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can mint ART: Within the assigned ART contract</li>
        <li>Can update ART: Within the assigned ART contract</li>
        <li>Can set royalties: For the ART contract they manage and any ART token in that contract</li>
      </ul>

      <p class="mb-2"><strong>Minter (Per ART Contract)</strong></p>
      <p>The Minter role is assigned to users who can mint new tokens:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can mint ART: Within the assigned ART contract</li>
        <li>Can update ART: Within the assigned ART contract</li>
      </ul>

      <p class="mb-2"><strong>Full Editor (Per ART Contract)</strong></p>
      <p>The Full Editor role is assigned to users who can update token metadata:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can update ART: Within the assigned ART contract</li>
      </ul>

      <p class="mb-2"><strong>Partial Editor (Per Token)</strong></p>
      <p>The Partial Editor role is assigned to users with limited editing capabilities:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can update specific ART tokens: Only tokens they have been explicitly granted permission for</li>
      </ul>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- Why Use ARC? -->
  <section id="why-use-arc" class="md:mb-12">
    <h2 class="text-3xl font-bold mb-6">Why Use ARC?</h2>
    
    <ul class="space-y-4">
      <li><strong>Decentralized & Immutable</strong> - Forever permanent, tamper-proof provenance records.</li>
      <li><strong>Artist Controlled</strong> - No intermediaries, artists manage their own contracts.</li>
      <li><strong>Flexible & Adaptable</strong> - Works across real-time blockchain networks.</li>
      <li><strong>Standards Maintained</strong> - Consistent and interoperable standards across systems.</li>
    </ul>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- Get Started -->
  <section id="get-started" class="mb-10 md:mb-20">
    <h2 class="text-3xl font-bold mb-6">Get Started</h2>
    
    <p class="mb-6">
      Artists can create their ARC contract and start minting ARTs through the ARC Dashboard. Whether 
      you're a contemporary artist, a gallery representing artists, or a collector, ARC provides new tools to establish 
      provenance and protect the legacy of art.
    </p>


    <Button>
      <a href="/work-in-progress" class="flex items-center">
        Join the Consortium
      </a>
    </Button>

  </section>
</div> 