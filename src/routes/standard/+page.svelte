<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<div class="container mx-auto px-4 py-20 max-w-4xl">
  <h1 class="text-4xl font-extrabold mb-6">The Standard</h1>
  
  <p class="mb-8">
    The Art Registry Consortium (ARC) establishes an open standard for documenting and tracking physical 
    artworks on the blockchain. Through artist-owned smart contracts and a modular token system, ARC 
    ensures that each artwork has a secure, standardized, and immutable record of provenance, exhibition 
    history, and ownership.
  </p>
  <hr class="my-20">
  <!-- 1. Artist-Owned Contracts -->
  <section class="mb-12">
    <h2 class="text-2xl font-bold mb-4">1. Artist-Owned Contracts</h2>
    
    <p class="mb-4">
      Each artist deploys their own ARC contract, giving them full control over their catalog and related ARTs. 
      Artists can update metadata, transfer ownership, and/or permanently retire existing works by using artist 
      dashboard and verify their works.
    </p>

    <div class="bg-muted p-4 rounded-md mb-4">
      <h3 class="font-semibold mb-2">Naming convention:</h3>
      <p class="mb-2">"ARC / Artist Name" (e.g., "ARC / Banksy")</p>
      <p>By maintaining individual contracts, artists retain sovereignty over their body of work while ensuring interoperability across the ARC ecosystem.</p>
    </div>

    <div class="bg-muted p-4 rounded-md">
      <h3 class="font-semibold mb-2">Registering Existing Contracts</h3>
      <p>
        Artists who have already deployed their own smart contract(s) (e.g., through Manifold) can easily map 
        their existing contract to the ARC registry. This allows artists to maintain their existing contracts while 
        ensuring their artworks benefit from the ARC standard and ecosystem (e.g., working with certified 
        galleries).
      </p>
    </div>
  </section>
  <hr class="my-20">
  <!-- 2. The Artwork Registry Token (ART) -->
  <section class="mb-12">
    <h2 class="text-2xl font-bold mb-4">2. The Artwork Registry Token (ART)</h2>
    
    <p class="mb-4">
      Each ART is unique, non-transferable record token to a physical artwork. It contains critical 
      metadata, including provenance, documentation, and ownership tracking.
    </p>

    <div class="mb-4">
      <h3 class="font-semibold mb-2">ART Fields:</h3>
      <ol class="list-decimal pl-6 space-y-1">
        <li><strong>Catalogue Inventory:</strong> A unique identifier assigned to the artwork within the artist's personal registry. E.g. INV-0001 or similar.</li>
        <li><strong>Artist Info:</strong> Name of the artist and location (if applicable) / wallet address.</li>
        <li><strong>Title:</strong> Title of the artwork.</li>
        <li><strong>Year of Creation:</strong> Year the physical work was completed.</li>
        <li><strong>Medium:</strong> Materials used to create the physical artwork (or "various materials").</li>
        <li><strong>Dimensions:</strong> Size of the physical work as height x width x depth (in your preferred units).</li>
        <li><strong>Edition Information:</strong> Edition number and size (e.g., "3/5") or "unique" if one-of-a-kind.</li>
        <li><strong>Series:</strong> A label used to group artworks that belong to the same thematic or conceptual body of work. This allows collectors to understand the context of an artwork by exploring its relationship to other works by selecting series.</li>
        <li><strong>Description:</strong> Brief description of the physical artwork.</li>
        <li><strong>Provenance:</strong> Chronological record of ownership, custody, and location of the artwork.</li>
        <li><strong>Exhibition History:</strong> List of exhibitions where the artwork has been displayed.</li>
        <li><strong>Certification Method:</strong> How the artwork is linked to the ART (e.g., NFC chip, QR code, token ID inscribed).</li>
        <li><strong>Condition Report:</strong> Documentation of the artwork's physical condition, including notes and photos.</li>
        <li><strong>Conservation History:</strong> Record of any conservation or restoration work performed on the artwork.</li>
        <li><strong>Bibliography:</strong> List of publications, articles, or catalogs where the artwork has been featured, with details such as author, title, publication, date, and page numbers.</li>
        <li><strong>Appraisals:</strong> History of professional appraisals of the artwork (e.g., "Sotheby's, September 2023").</li>
        <li><strong>Related Works:</strong> Links to other artworks by the artist that are related to this piece.</li>
        <li><strong>Notes:</strong> Additional information relevant to the artwork.</li>
        <li><strong>Wallet Address:</strong> The current owner's wallet (if applicable) is automatically linked to the artwork. This could include multiple wallets if the artwork is co-owned or fractionally owned.</li>
        <li><strong>Additional Metadata:</strong> Any other relevant information that adds to the artwork's documentation or story.</li>
        <li><strong>Royalties:</strong> Percentage of resale royalties set by the artist.</li>
      </ol>
    </div>
  </section>
  <hr class="my-20">
  <!-- 3. The ART Stamp - Linking Physical & Digital -->
  <section class="mb-12">
    <h2 class="text-2xl font-bold mb-4">3. The ART Stamp – Linking Physical & Digital</h2>
    
    <p class="mb-4">
      To associate an ART with a physical artwork, artists must include an ART Stamp on the piece. This 
      ensures collectors, galleries, and institutions can verify ownership on-chain.
    </p>

    <div class="mb-4">
      <h3 class="font-semibold mb-2">ART Stamp Format</h3>
      
      <p class="mb-4">
        A label should include the following information: on the back of the artwork, certificate of authenticity, or a 
        discreet location:
      </p>

      <div class="bg-muted p-4 rounded-md">
        <p>ART ID: [Token ID]</p>
        <p>Artist: [Artist Name or Pseudonym] / [Wallet addr.]</p>
        <p>Title: [Artwork Title]</p>
        <p>Year: [Year Created]</p>
        <p>Token ID: [ART Token ID]</p>
      </div>
    </div>
  </section>
  <hr class="my-20">
  <!-- 4. ART Must Follow the Physical Artwork -->
  <section class="mb-12">
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
  <hr class="my-20">
  <!-- 5. Roles & Access Control -->
  <section class="mb-12">
    <h2 class="text-2xl font-bold mb-4">5. Roles & Access Control</h2>
    
    <p class="mb-4">
      To ensure proper management of ARTs, ARC contracts implement role-based access control, 
      allowing artists to delegate specific permissions:
    </p>

    <div class="mb-4">
      <h3 class="font-semibold mb-2">Roles</h3>
      
      <p class="mb-2"><strong>Contract Owner (Artist) [The ART Contract]</strong></p>
      <ul class="list-disc pl-6 mb-4">
        <li>Mint new ART</li>
        <li>Set metadata</li>
        <li>Transfer ownership (must meet ART criteria)</li>
        <li>Set out royalties for any ART token in their contract</li>
      </ul>

      <p class="mb-2"><strong>Legacy Provider (Artist Designee) [The ART Contract]</strong></p>
      <ul class="list-disc pl-6 mb-4">
        <li>Appointed by the artist to manage their legacy</li>
        <li>Cannot mint new ART, but can update existing ARTs (subject to their wallet or pass away)</li>
        <li>Transfer ownership</li>
        <li>Can set royalties for any ART token in the contract they manage</li>
      </ul>

      <p class="mb-2"><strong>Collector (owns a specific ART contract)</strong></p>
      <ul class="list-disc pl-6 mb-4">
        <li>Transfer ownership (to another collector)</li>
        <li>Can view ART</li>
      </ul>

      <p class="mb-2"><strong>Public (can query specific ART contract)</strong></p>
      <ul class="list-disc pl-6">
        <li>Can query ART</li>
      </ul>
    </div>
  </section>
  <hr class="my-20">
  <!-- Why Use ARC? -->
  <section class="mb-12">
    <h2 class="text-3xl font-bold mb-6">Why Use ARC?</h2>
    
    <ul class="space-y-4">
      <li><strong>Decentralized & Immutable</strong> - Forever permanent, tamper-proof provenance records.</li>
      <li><strong>Artist Controlled</strong> - No intermediaries, artists manage their own contracts.</li>
      <li><strong>Flexible & Adaptable</strong> - Works across real-time blockchain networks.</li>
      <li><strong>Standards Maintained</strong> - Consistent and interoperable standards across systems.</li>
    </ul>
  </section>
  <hr class="my-20">
  <!-- Get Started -->
  <section class="mb-20">
    <h2 class="text-3xl font-bold mb-6">Get Started</h2>
    
    <p class="mb-6">
      Artists can create their ARC contract and start minting ARTs through the ARC Dashboard. Whether 
      you're a contemporary artist, a gallery representing artists, or a collector, ARC provides new tools to establish 
      provenance and protect the legacy of art.
    </p>


    <Button>Launch Dashboard</Button>

  </section>
</div> 