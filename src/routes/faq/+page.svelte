<script lang="ts">
  // Import any UI components we might need
  import { Button } from "$lib/components/ui/button/index.js";
  import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
  } from "$lib/components/ui/accordion/index.js";
</script>

<div class="container mx-auto px-4 max-w-4xl md:pb-10">
  
  
  <section class="md:mb-12 pt-12 md:pt-20">
    <h1 class="text-3xl md:text-5xl font-extrabold mb-6 leading-tight">Frequently Asked Questions</h1>
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">General Questions</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="what-is-arc">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What is the Art Registry Consortium (ARC)?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            The <strong>Art Registry Consortium (ARC)</strong> is an open standard for documenting and verifying physical artworks on the blockchain. 
            Through artist-owned smart contracts and <strong>Artwork Registry Tokens (ARTs)</strong>, ARC ensures that each artwork has a secure, 
            decentralized, and immutable record of provenance, exhibition history, and ownership.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="who-can-use-arc">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Who can use ARC?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            ARC is designed for <strong>artists, collectors, galleries, and institutions</strong> who want to document, verify, and manage 
            physical artworks on the blockchain. Artists maintain full control over their smart contracts and ARTs, while collectors and 
            galleries benefit from immutable provenance records.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Artwork Registry Token (ART)</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="what-is-art">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What is an ART?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            An <strong>Artwork Registry Token (ART)</strong> is a blockchain-based certificate that records essential details about a 
            physical artwork, including provenance, exhibition history, and ownership.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="what-info-in-art">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What information is stored in an ART?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">Each ART contains critical metadata, including:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><span class="font-semibold">Catalogue Inventory:</span> A unique identifier assigned to the artwork within the artist's personal registry. E.g. INV-0001 or similar.</li>
            <li><span class="font-semibold">Artist Info:</span> Name of the artist and location (if applicable) / wallet address.</li>
            <li><span class="font-semibold">Title:</span> Title of the artwork.</li>
            <li><span class="font-semibold">Year of Creation:</span> Year the physical work was completed.</li>
            <li><span class="font-semibold">Medium:</span> Materials used to create the physical artwork (or "various materials").</li>
            <li><span class="font-semibold">Dimensions:</span> Size of the physical work as height x width x depth (in your preferred units).</li>
            <li><span class="font-semibold">Edition Information:</span> Edition number and size (e.g., "3/5") or "unique" if one-of-a-kind.</li>
            <li><span class="font-semibold">Series:</span> A label used to group artworks that belong to the same thematic or conceptual body of work. This allows collectors to understand the context of an artwork by exploring its relationship to other works by selecting series.</li>
            <li><span class="font-semibold">Description:</span> Brief description of the physical artwork.</li>
            <li><span class="font-semibold">Provenance:</span> Chronological record of ownership, custody, and location of the artwork.</li>
            <li><span class="font-semibold">Exhibition History:</span> List of exhibitions where the artwork has been displayed.</li>
            <li><span class="font-semibold">Certification Method:</span> How the artwork is linked to the ART (e.g., NFC chip, QR code, token ID inscribed).</li>
            <li><span class="font-semibold">Condition Report:</span> Documentation of the artwork's physical condition, including notes and photos.</li>
            <li><span class="font-semibold">Conservation History:</span> Record of any conservation or restoration work performed on the artwork.</li>
            <li><span class="font-semibold">Bibliography:</span> List of publications, articles, or catalogs where the artwork has been featured, with details such as author, title, publication, date, and page numbers.</li>
            <li><span class="font-semibold">Appraisals:</span> History of professional appraisals of the artwork (e.g., "Sotheby's, September 2023").</li>
            <li><span class="font-semibold">Related Works:</span> Links to other artworks by the artist that are related to this piece.</li>
            <li><span class="font-semibold">Notes:</span> Additional information relevant to the artwork.</li>
            <li><span class="font-semibold">Wallet Address:</span> The current owner's wallet (if applicable) is automatically linked to the artwork. This could include multiple wallets if the artwork is co-owned or fractionally owned.</li>
            <li><span class="font-semibold">Additional Metadata:</span> Any other relevant information that adds to the artwork's documentation or story.</li>
            <li><span class="font-semibold">Royalties:</span> Percentage of resale royalties set by the artist.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="can-art-be-updated">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Can an ART be updated after it is created?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Yes, certain fields such as <strong>Exhibition History, Provenance, Condition Reports, Sales Information, and Notes</strong> can be 
            updated post-minting by authorized roles.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Linking ART to Physical Artworks</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="how-art-links-to-physical">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">How does an ART link to a physical artwork?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            An ART is linked to its physical counterpart through a unique <strong>ART Stamp</strong>, which includes:
          </p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Artist Name</strong></li>
            <li><strong>Artist Wallet Address</strong></li>
            <li><strong>Blockchain</strong></li>
            <li><strong>Contract Address</strong></li>
            <li><strong>Token ID</strong></li>
          </ul>
          <p class="mt-2 text-sm md:text-base">This ensures that anyone can verify the artwork's authenticity on-chain.</p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="artwork-sold">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What happens if an artwork is sold?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            When a physical artwork is sold, its ART <strong>must be transferred</strong> to the new owner's wallet. This guarantees 
            accurate provenance tracking and prevents orphaned tokens that no longer correspond to the real-world piece.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Ownership & Transactions</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="who-owns-art">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Who owns an ART?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            The owner of an ART is the entity holding the token in their wallet. This should always match the physical artwork's real-world owner.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="art-lost-stolen">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What happens if an ART is lost or stolen?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Because ARTs are blockchain-based, they cannot be modified or reversed. It is crucial that collectors safeguard their wallets 
            and use secure methods for transactions.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="transfer-without-selling">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Can I transfer an ART without selling the artwork?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            No, an ART should always accompany the physical artwork. Any transfer of the token should reflect the real-world ownership change.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Roles & Access Control</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="different-roles">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What are the different roles in ARC contracts?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">ARC contracts allow for delegated access through the following roles:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Full Admin (ARC Team):</strong> Can upgrade contracts, mint ARTs, modify all tokens, assign roles, and transfer ARTs.</li>
            <li><strong>Contract Owner (Artist):</strong> Can mint and update ARTs.</li>
            <li><strong>Minter (Assigned Role):</strong> Can mint and update ARTs.</li>
            <li><strong>Full Editor (Assigned Role):</strong> Can update ARTs.</li>
            <li><strong>Partial Editor (Assigned Role):</strong> Can update specific ARTs.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="revoke-access">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Can artists revoke access to roles?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Yes, artists have full control over their contracts and can assign or revoke roles as needed.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="artist-passes-away">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What happens if an artist passes away?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            If an artist dies, ARC can intervene by assigning roles to specific entities—such as family members, foundations, or 
            institutions—to preserve the artist's legacy. This ensures that their catalog remains accessible, their ARTs can be 
            updated when necessary, and their artistic contributions remain documented on the blockchain. Artists can pre-designate 
            successors in their contracts to facilitate smooth transitions.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">ARC's Administrative Role</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="arc-control">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Does ARC have control over all contracts?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            For now, yes, ARC retains full administrative power over all contracts, but this is for <strong>support purposes only</strong>. 
            The ARC wallet is controlled by a <strong>multisig mechanism</strong>, requiring multiple authorized signatures to execute 
            any administrative action.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="why-admin-access">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Why does ARC have admin access?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Admin features are used strictly as a <strong>last resort</strong> in cases of technical failures, artist succession issues, 
            or other critical interventions. ARC does not interfere with artist-owned contracts unless necessary to support the integrity 
            of the ecosystem.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Getting Started</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="create-arc-contract">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">How can I create an ARC contract?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Artists can deploy their ARC contract through the <strong>ARC Dashboard</strong>, where they can mint ARTs and manage their catalog.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="cost-to-use">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">How much does it cost to use ARC?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            The cost depends on blockchain transaction fees and the number of ARTs minted. ARC does not charge intermediary fees—artists 
            retain full control.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="supported-blockchains">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Which blockchains does ARC support?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            ARC is designed for interoperability and currently supports <strong>Ethereum, Arbitrum, Optimism, and Base</strong>, with future expansion planned.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Technical & Security</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="is-arc-decentralized">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Is ARC decentralized?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Yes, ARC operates on a decentralized architecture where each artist maintains control over their own smart contract, 
            ensuring that provenance records remain tamper-proof and independent.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="verify-authenticity">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">How is the authenticity of an ART verified?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Collectors and institutions can verify an ART by cross-referencing the <strong>ART Stamp</strong> on the physical artwork 
            with the on-chain metadata.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="can-art-be-burned">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Can an ART be burned?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Theoretically, yes. However, for the integrity of the system, you should not burn ART tokens.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="md:mb-12">
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Support & Contact</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="get-help">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Where can I get help?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            For support, visit our <a href="https://discord.com/invite/TFkNXhhP" class="text-blue-600 hover:underline">Help Channel on Discord</a>.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="community">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Is there a community for ARC users?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Yes! Join our <a href="https://discord.com/invite/TFkNXhhP" class="text-blue-600 hover:underline">Discord</a> to connect with other artists, collectors, and institutions using ARC.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
</div> 