<script lang="ts">
  // Import any UI components we might need
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<div class="container mx-auto px-4 max-w-4xl md:pb-10">
<section class="md:mb-12 pt-12 md:pt-20">
    <h1 class="text-3xl md:text-4xl font-extrabold mb-4 md:mb-6">About ARC</h1>
    <h2 class="text-xl md:text-2xl font-bold mb-3 md:mb-4">A New Standard for Art Provenance</h2>
    <p class="mb-4 md:mb-6">
      The <strong>Art Registry Consortium (ARC)</strong> is an open-source, decentralized standard designed to transform how physical artworks are documented and authenticated. By leveraging blockchain technology, ARC provides an immutable, transparent, and artist-driven approach to provenance, ensuring that every artwork's history, ownership, and legitimacy are preserved for generations to come.
    </p>

    <hr class="my-10 md:my-20" />

    <h3 class="text-lg md:text-xl font-bold mt-6 md:mt-8 mb-3 md:mb-4">The Problem with Traditional Art Documentation</h3>
    <p class="mb-3 md:mb-4">
      For centuries, provenance records have been scattered, fragmented, and often unreliable. Physical certificates, handwritten documentation, and centralized databases have left the art world vulnerable to forgery, misattribution, and loss of historical data. Collectors, institutions, and even artists themselves have struggled to maintain accurate and verifiable records.
    </p>

    <p class="font-bold mb-2">Existing Challenges:</p>
    <ul class="list-disc pl-5 md:pl-6 mb-4 md:mb-6">
      <li class="mb-1 md:mb-2"><strong>Forgery & Fraud:</strong> Counterfeit artworks thrive in the absence of immutable provenance records.</li>
      <li class="mb-1 md:mb-2"><strong>Loss & Disconnection:</strong> Physical records can be misplaced, damaged, or separated from the artwork.</li>
      <li class="mb-1 md:mb-2"><strong>Opaque Transactions:</strong> The lack of a standardized, transparent system makes it difficult to verify an artwork's legitimacy and ownership history.</li>
      <li class="mb-1 md:mb-2"><strong>Institutional Dependence:</strong> Verification has historically relied on centralized authorities, leaving artists and collectors at the mercy of intermediaries.</li>
    </ul>

    <h3 class="text-lg md:text-xl font-bold mt-6 md:mt-8 mb-3 md:mb-4">How ARC Solves This</h3>
    <p class="mb-3 md:mb-4">
      ARC replaces outdated documentation methods with a <strong>permanent, artist-controlled</strong> blockchain-based registry. By providing an <strong>Artwork Registry Token (ART)</strong> for each physical piece, ARC ensures that provenance remains secure, transferable, and publicly verifiable without the need for third-party trust.
    </p>

    <p class="font-bold mb-2">Key Benefits:</p>
    <ul class="list-disc pl-5 md:pl-6 mb-0 md:mb-6">
      <li class="mb-1 md:mb-2"><strong>Immutable Provenance:</strong> Each artwork is linked to a <strong>verifiable digital certificate</strong> that permanently records its history.</li>
      <li class="mb-1 md:mb-2"><strong>Artist-Owned Contracts:</strong> Artists control their own <strong>ARC smart contracts</strong>, dictating how their works are documented and ensuring long-term autonomy.</li>
      <li class="mb-1 md:mb-2"><strong>Interoperability & Flexibility:</strong> ARC is designed to work across blockchain networks, making it adaptable to evolving technologies and market needs.</li>
      <li class="mb-1 md:mb-2"><strong>Seamless Verification:</strong> Collectors, galleries, and institutions can instantly verify an artwork's authenticity with on-chain data.</li>
      <li class="mb-0 md:mb-2"><strong>Decentralization & Transparency:</strong> By removing reliance on centralized authorities, ARC ensures provenance remains intact even as institutions and marketplaces change over time.</li>
    </ul>
  </section>

  <hr class="my-5 md:my-20" />

  <section class="md:mb-12">
    <h2 class="text-xl md:text-2xl font-bold mb-4 md:mb-6">How ARC Works</h2>

    <div class="mb-6 md:mb-8">
      <h3 class="text-lg md:text-xl font-bold mb-2 md:mb-3">1. Artist-Owned Smart Contracts</h3>
      <p>
        Each artist mints their works using an <strong>ARC contract</strong>, ensuring every record remains under their control while following the ARC standard. These contracts allow artists to <strong>mint, update, and verify</strong> their artworks independently.
      </p>
    </div>

    <div class="mb-6 md:mb-8">
      <h3 class="text-lg md:text-xl font-bold mb-2 md:mb-3">2. Artwork Registry Token (ART)</h3>
      <p class="mb-2">
        Every physical artwork is paired with an <strong>ART</strong>, a blockchain-based certificate that holds essential metadata, including:
      </p>
      <ul class="list-disc pl-5 md:pl-6">
        <li><strong>Artist Information & Catalogue Number</strong></li>
        <li><strong>Title, Medium, and Dimensions</strong></li>
        <li><strong>Provenance & Exhibition History</strong></li>
        <li><strong>Condition Reports & Certification Methods</strong></li>
        <li><strong>Ownership & Sales History</strong></li>
        <li><strong>Royalties for Secondary Sales</strong></li>
      </ul>
    </div>

    <div class="mb-6 md:mb-8">
      <h3 class="text-lg md:text-xl font-bold mb-2 md:mb-3">3. Connecting Physical & Digital</h3>
      <p>
        Each artwork must include an <strong>ART Stamp</strong>, linking it to its corresponding blockchain record. Artists can use <strong>NFC chips, QR codes, or direct inscriptions</strong> to ensure that the digital certificate remains inseparable from the physical piece. This prevents fraudulent claims and ensures that provenance is always accessible.
      </p>
    </div>

    <div class="mb-0 md:mb-8">
      <h3 class="text-lg md:text-xl font-bold mb-2 md:mb-3">4. Transfer & Resale Integrity</h3>
      <p>
        Whenever an artwork is sold or transferred, its <strong>ART</strong> must be updated on-chain. This guarantees that ownership changes are accurately documented and that provenance remains an unbroken chain of trust.
      </p>
    </div>
  </section>

  <hr class="my-5 md:my-20" />

  <section class="md:mb-12">
    <h2 class="text-xl md:text-2xl font-bold mb-4 md:mb-6">The Art Registry Consortium: A Community-Driven Standard</h2>
    <p class="mb-4 md:mb-6">
      ARC is more than just a standard—it is a <strong>collaborative, open-source initiative</strong> designed to establish the new global standard for art documentation. As a decentralized consortium, ARC welcomes contributions from artists, collectors, galleries, and developers who share the vision of a transparent, fraud-resistant art world.
    </p>

    <h3 class="text-lg md:text-xl font-bold mb-2 md:mb-3">Open & Accessible</h3>
    <ul class="list-disc pl-5 md:pl-6 md:mb-6">
      <li class="mb-1 md:mb-2"><strong>Artists with Existing Smart Contracts</strong>: Those who have already deployed contracts (e.g., via Manifold or custom ERC-721/ERC-1155 implementations) can submit their contract information to ARC to register their works and benefit from its verification ecosystem.</li>
      <li class="mb-1 md:mb-2"><strong>Community-Governed</strong>: ARC evolves through public participation, ensuring that the standard remains artist-friendly and technologically advanced.</li>
      <li class="md:mb-2"><strong>Built for the Future</strong>: By keeping the standard open-source, ARC adapts to new innovations in blockchain, AI, and authentication technologies, ensuring long-term relevance.</li>
    </ul>
  </section>

  <hr class="my-5 md:my-20" />

  <section class="mb-10 md:mb-12">
    <h2 class="text-xl md:text-2xl font-bold mb-4 md:mb-6">A Decentralized Future for Art</h2>
    <p class="mb-4 md:mb-6">
      The way we document and verify art is changing. ARC is leading this transformation by giving artists, collectors, and institutions the tools to ensure that <strong>artistic legacies remain unbroken, transparent, and verifiable—forever.</strong>
    </p>

    <p class="mb-6 md:mb-8">
      Whether you are an artist looking to secure your body of work, a collector ensuring the authenticity of your acquisitions, or a curator building a historical record, ARC provides the foundation for a <strong>new era of art provenance.</strong>
    </p>

    <p class="text-lg md:text-xl font-bold mb-4 md:mb-6">Join ARC today and be part of the future of art documentation.</p>
    <Button variant="default" class="px-4 md:px-6 py-2 md:py-3">Launch the Dashboard</Button>
  </section>
</div> 