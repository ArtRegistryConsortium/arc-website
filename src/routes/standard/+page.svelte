<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import SideMenu from "$lib/components/SideMenu.svelte";
  
  // Define sections for the side menu
  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "identity-management", title: "1. Identity Management" },
    { id: "artist-owned-contracts", title: "2. Artist-Owned Contracts" },
    { id: "artwork-registry-token", title: "3. Artwork Registry Token" },
    { id: "art-stamp", title: "4. ART Stamp" },
    { id: "art-follows-artwork", title: "5. ART Follows Artwork" },
    { id: "roles-access-control", title: "6. Roles & Access Control" },
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
      artworks on the blockchain. Through identity management, artist-owned smart contracts and a modular token system, ARC 
      ensures that each artwork has a secure, standardized, and immutable record of provenance, exhibition 
      history, and ownership.
    </p>
  </section>
  
  <hr class="my-5 md:my-20" />
  <!-- 1. Identity Management -->
  <section id="identity-management">
    <h2 class="text-2xl font-bold mb-4">1. Identity Management</h2>
    
    <p class="mb-4">
      The ARC system begins with robust identity management for all ecosystem participants. Each identity has a unique ID and is associated with a wallet address, ensuring proper authentication and authorization throughout the system.
    </p>

    <div class="bg-muted p-8 rounded-md mb-4">
      <h3 class="font-semibold mb-2">Identity Types:</h3>
      <ul class="list-disc pl-6 space-y-2">
        <li><span class="font-semibold">Artist:</span> Creators who deploy their own ART Contracts and mint ARTs.</li>
        <li><span class="font-semibold">Gallery:</span> Entities that represent artists and facilitate art sales.</li>
        <li><span class="font-semibold">Institution:</span> Museums, foundations, and other organizations that exhibit, collect, or preserve art.</li>
        <li><span class="font-semibold">Collector:</span> Individuals or entities who own artworks and their corresponding ARTs.</li>
      </ul>
    </div>

    <div class="bg-muted p-8 rounded-md">
      <h3 class="font-semibold mb-2">Identity Information:</h3>
      <ul class="list-disc pl-6 space-y-2">
        <li><span class="font-semibold">Name:</span> Full name or alias of the identity.</li>
        <li><span class="font-semibold">Description:</span> Brief description of the identity.</li>
        <li><span class="font-semibold">Image:</span> Profile image stored on Arweave.</li>
        <li><span class="font-semibold">Links:</span> Website or social media URLs.</li>
        <li><span class="font-semibold">Tags:</span> Keywords associated with the identity.</li>
        <li><span class="font-semibold">Artist-specific:</span> Date of birth, date of death (if applicable), and location.</li>
        <li><span class="font-semibold">Gallery/Institution-specific:</span> Physical addresses.</li>
        <li><span class="font-semibold">Artist-specific:</span> RepresentedBy - Array of gallery/institution identity IDs representing the artist.</li>
        <li><span class="font-semibold">Gallery/Institution-specific:</span> RepresentedArtists - Array of artist identity IDs represented by the gallery/institution.</li>
      </ul>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 2. Artist-Owned Contracts -->
  <section id="artist-owned-contracts">
    <h2 class="text-2xl font-bold mb-4">2. Artist-Owned Contracts</h2>
    
    <p class="mb-4">
      Each artist deploys their own ARC contract, giving them full control over their catalog and minted ARTs. These contracts follow the ARC standard, ensuring consistency while allowing flexibility in how artists document and verify their works.
    </p>

    <div class="bg-muted p-8 rounded-md mb-4">
      <h3 class="font-semibold mb-2">Naming convention:</h3>
      <p class="mb-2">"ARC / Artist Name" (e.g., "ARC / Banksy")</p>
      <p>By maintaining individual contracts, artists retain sovereignty over their body of work while ensuring interoperability across the ARC ecosystem.</p>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 3. The Artwork Registry Token (ART) -->
  <section id="artwork-registry-token">
    <h2 class="text-2xl font-bold mb-4">3. The Artwork Registry Token (ART)</h2>
    
    <p class="mb-4">
      Each ART is a unique, blockchain-based record tied to a physical artwork. It contains critical metadata, ensuring traceability, authentication, and provenance tracking.
    </p>
    <div class="bg-muted p-8 rounded-md">
      <h3 class="font-semibold mb-2">ART Fields:</h3>
      <ol class="list-decimal pl-6 space-y-2">
        <li><span class="font-semibold">Artist Identity ID:</span> The unique identifier linking to the artist's identity in the Identity Contract.</li>
        <li><span class="font-semibold">Title:</span> The name of the artwork.</li>
        <li><span class="font-semibold">Description:</span> A detailed description of the artwork, its context, and significance.</li>
        <li><span class="font-semibold">Year of Creation:</span> The year the artwork was completed.</li>
        <li><span class="font-semibold">Medium:</span> Materials used to create the artwork (e.g., "oil on canvas," "bronze sculpture").</li>
        <li><span class="font-semibold">Dimensions:</span> Size of the artwork, listed as height x width x depth (in cm or inches).</li>
        <li><span class="font-semibold">Edition:</span> If the artwork is part of an edition, include the edition number and total editions (e.g., "1/10").</li>
        <li><span class="font-semibold">Series:</span> A label used to group artworks that belong to the same thematic or conceptual body of work. This allows artists to document and organize pieces that are part of a unified vision, making it easier for collectors and institutions to understand the context of each artwork within a larger narrative.</li>
        <li><span class="font-semibold">Catalogue Inventory:</span> <span class="text-red-500">[REMOVED - Catalogue Inventory should be stored in the Note field]</span></li>
        <li><span class="font-semibold">Image:</span> A high-resolution image or scan of the artwork stored on Arweave.</li>
        <li><span class="font-semibold">Sales Information:</span> <span class="text-red-500">[REMOVED - Sales information will be stored on-chain]</span></li>
        <li><span class="font-semibold">Certification Method:</span> <span class="text-red-500">[REMOVED - Certification method is always the ART Stamp]</span></li>
        <li><span class="font-semibold">Exhibition History:</span> JSON string containing an array of exhibitions with name, date, and location.</li>
        <li><span class="font-semibold">Condition Reports:</span> JSON string containing an array of reports with date and description of the artwork's condition.</li>
        <li><span class="font-semibold">Artist Statement:</span> <span class="text-red-500">[REMOVED - Artist statements should be included in the Note field]</span></li>
        <li><span class="font-semibold">Bibliography:</span> JSON string containing an array of references with title, author, and page.</li>
        <li><span class="font-semibold">Keywords or Tags:</span> An array of themes, styles, or movements related to the artwork (e.g., "surrealism," "landscape").</li>
        <li><span class="font-semibold">Location / Collection:</span> JSON string containing location and collection information where the artwork resides.</li>
        <li><span class="font-semibold">Status:</span> <span class="text-red-500">[REMOVED]</span></li>
        <li><span class="font-semibold">Note:</span> A flexible field for additional remarks, context, or annotations related to the artwork. This could include restoration notes, collector insights, special dedications, artist statements, or any other relevant information that does not fit into the predefined fields.</li>
        <li><span class="font-semibold">Royalties:</span> Percentage of resale royalties set by the artist (in basis points, e.g., 1000 = 10%).</li>
      </ol>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 4. The ART Stamp - Linking Physical & Digital -->
  <section id="art-stamp" class="md:mb-12">
    <h2 class="text-2xl font-bold mb-4">4. The ART Stamp – Linking Physical & Digital</h2>
    
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
      <p>Identity ID: [Artist Identity ID]</p>
      <p>Blockchain: [Ethereum / Arbitrum / Optimism / Base, etc.]</p>
      <p>Contract Address: [ART Contract Address]</p>
      <p>Token ID: [ART Token ID]</p>
    </div>
  </section>
  <hr class="my-5 md:my-20" />
  <!-- 5. ART Must Follow the Physical Artwork -->
  <section id="art-follows-artwork" class="md:mb-12">
    <h2 class="text-2xl font-bold mb-4">5. ART Must Follow the Physical Artwork</h2>
    
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
  <!-- 6. Roles & Access Control -->
  <section id="roles-access-control" class="md:mb-12">
    <h2 class="text-2xl font-bold mb-4">6. Roles & Access Control</h2>
    
    <p class="mb-4">
      To ensure proper management of ARTs, ARC contracts implement role-based access control tied to Identities (via Identity ID), not wallet addresses, 
      allowing artists to delegate specific permissions:
    </p>

    <div class="bg-muted p-8 rounded-md">
      <h3 class="font-semibold mb-2">Roles</h3>
      
      <p class="mb-2"><strong>Full Admin (ARC)</strong></p>
      <p>The Full Admin role is assigned to the ARC team:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can add/remove other Full Admins (via Identity ID)</li>
        <li>Deployer of contract infrastructure</li>
        <li>Can upgrade all contracts</li>
        <li>Can modify all storage in Identity Contract</li>
        <li>Can add/remove roles (via Identity ID) on Identity and ART Contracts</li>
        <li>Can mint/update/transfer ART on any contract</li>
        <li>Can set royalties on any ART or ART Contract</li>
      </ul>

      <p class="mb-2"><strong>Art Contract Owner (Artist)</strong></p>
      <p>The Contract Owner role is assigned to the artist who deploys an ART contract:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can transfer ownership of their ART Contract to another Identity ID</li>
        <li>Can grant/remove roles (Custodian, Minter, Full Editor, Partial Editor) via Identity ID</li>
        <li>Can mint/update ART and set royalties in their ART Contract</li>
      </ul>

      <p class="mb-2"><strong>Custodian</strong></p>
      <p>The Custodian role is assigned to manage an Identity or ART Contract:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can update their assigned Identity (via Identity ID) or ART Contract</li>
        <li>Can mint/update ART and set royalties in their assigned ART Contract</li>
        <li>Can assign roles (Minter, Full Editor, Partial Editor) via Identity ID</li>
      </ul>

      <p class="mb-2"><strong>Minter</strong></p>
      <p>The Minter role is assigned to users who can mint new tokens:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can mint and update ART in their assigned ART Contract (no royalty control)</li>
      </ul>

      <p class="mb-2"><strong>Full Editor</strong></p>
      <p>The Full Editor role is assigned to users who can update token metadata:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can update all ART in their assigned ART Contract (no royalty control)</li>
      </ul>

      <p class="mb-2"><strong>Partial Editor</strong></p>
      <p>The Partial Editor role is assigned to users with limited editing capabilities:</p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can update specific ART tokens they are assigned to (no royalty control)</li>
      </ul>
      
      <p class="mb-2"><strong>Everyone</strong></p>
      <ul class="list-disc pl-6 mb-4">
        <li>Can update their own Identity</li>
        <li>Can own and transfer ART tokens they own</li>
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
