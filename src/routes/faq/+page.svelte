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

<div class="container mx-auto px-4 py-20 max-w-4xl">
  <h1 class="text-4xl font-bold mb-6">Frequently Asked Questions (FAQ)</h1>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">General Questions</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="what-is-arc">
        <AccordionTrigger>What is the Art Registry Consortium (ARC)?</AccordionTrigger>
        <AccordionContent>
          <p>
            The <strong>Art Registry Consortium (ARC)</strong> is an open standard for documenting and verifying physical artworks on the blockchain. 
            Through artist-owned smart contracts and <strong>Artwork Registry Tokens (ARTs)</strong>, ARC ensures that each artwork has a secure, 
            decentralized, and immutable record of provenance, exhibition history, and ownership.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="who-can-use-arc">
        <AccordionTrigger>Who can use ARC?</AccordionTrigger>
        <AccordionContent>
          <p>
            ARC is designed for <strong>artists, collectors, galleries, and institutions</strong> who want to document, verify, and manage 
            physical artworks on the blockchain. Artists maintain full control over their smart contracts and ARTs, while collectors and 
            galleries benefit from immutable provenance records.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">Artwork Registry Token (ART)</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="what-is-art">
        <AccordionTrigger>What is an ART?</AccordionTrigger>
        <AccordionContent>
          <p>
            An <strong>Artwork Registry Token (ART)</strong> is a blockchain-based certificate that records essential details about a 
            physical artwork, including provenance, exhibition history, and ownership.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="what-info-in-art">
        <AccordionTrigger>What information is stored in an ART?</AccordionTrigger>
        <AccordionContent>
          <p>Each ART contains critical metadata, including:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Catalogue Inventory</strong> (Unique identifier)</li>
            <li><strong>Artist Info</strong> (Name + Wallet Address)</li>
            <li><strong>Title, Year, Medium, Dimensions</strong></li>
            <li><strong>Edition & Series Information</strong></li>
            <li><strong>Exhibition & Sales History</strong></li>
            <li><strong>Certification Method</strong> (QR Code, NFC, etc.)</li>
            <li><strong>Condition Reports, Artist Statement, Bibliography</strong></li>
            <li><strong>Ownership & Status Updates</strong></li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="can-art-be-updated">
        <AccordionTrigger>Can an ART be updated after it is created?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes, certain fields such as <strong>Exhibition History, Condition Reports, Sales Information, and Notes</strong> can be 
            updated post-minting by authorized roles.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">Linking ART to Physical Artworks</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="how-art-links-to-physical">
        <AccordionTrigger>How does an ART link to a physical artwork?</AccordionTrigger>
        <AccordionContent>
          <p>
            An ART is linked to its physical counterpart through a unique <strong>ART Stamp</strong>, which includes:
          </p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Artist Name</strong></li>
            <li><strong>Blockchain & Smart Contract Address</strong></li>
            <li><strong>Artist Wallet Address</strong></li>
            <li><strong>Token ID</strong></li>
          </ul>
          <p class="mt-2">This ensures that anyone can verify the artwork's authenticity on-chain.</p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="artwork-sold">
        <AccordionTrigger>What happens if an artwork is sold?</AccordionTrigger>
        <AccordionContent>
          <p>
            When a physical artwork is sold, its ART <strong>must be transferred</strong> to the new owner's wallet. This guarantees 
            accurate provenance tracking and prevents orphaned tokens that no longer correspond to the real-world piece.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">Ownership & Transactions</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="who-owns-art">
        <AccordionTrigger>Who owns an ART?</AccordionTrigger>
        <AccordionContent>
          <p>
            The owner of an ART is the entity holding the token in their wallet. This should always match the physical artwork's real-world owner.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="art-lost-stolen">
        <AccordionTrigger>What happens if an ART is lost or stolen?</AccordionTrigger>
        <AccordionContent>
          <p>
            Because ARTs are blockchain-based, they cannot be modified or reversed. It is crucial that collectors safeguard their wallets 
            and use secure methods for transactions.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="transfer-without-selling">
        <AccordionTrigger>Can I transfer an ART without selling the artwork?</AccordionTrigger>
        <AccordionContent>
          <p>
            No, an ART should always accompany the physical artwork. Any transfer of the token should reflect the real-world ownership change.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">Roles & Access Control</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="different-roles">
        <AccordionTrigger>What are the different roles in ARC contracts?</AccordionTrigger>
        <AccordionContent>
          <p>ARC contracts allow for delegated access through the following roles:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Full Admin (ARC Team):</strong> Can upgrade contracts, mint ARTs, modify all tokens, assign roles, and transfer ARTs.</li>
            <li><strong>Contract Owner (Artist):</strong> Can mint and update ARTs.</li>
            <li><strong>Minter (Assigned Role):</strong> Can mint and update ARTs.</li>
            <li><strong>Full Editor (Assigned Role):</strong> Can update ARTs.</li>
            <li><strong>Partial Editor (Assigned Role):</strong> Can update specific ART fields.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="revoke-access">
        <AccordionTrigger>Can artists revoke access to roles?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes, artists have full control over their contracts and can assign or revoke roles as needed.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="artist-passes-away">
        <AccordionTrigger>What happens if an artist passes away?</AccordionTrigger>
        <AccordionContent>
          <p>
            If an artist dies, ARC can intervene by assigning roles to specific entities—such as family members, foundations, or 
            institutions—to preserve the artist's legacy. This ensures that their catalog remains accessible, their ARTs can be 
            updated when necessary, and their artistic contributions remain documented on the blockchain. Artists can pre-designate 
            successors in their contracts to facilitate smooth transitions.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">ARC's Administrative Role</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="arc-control">
        <AccordionTrigger>Does ARC have control over all contracts?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes, ARC retains full administrative power over all contracts, but this is for <strong>support purposes only</strong>. 
            The ARC wallet is controlled by a <strong>multisig mechanism</strong>, requiring multiple authorized signatures to execute 
            any administrative action.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="why-admin-access">
        <AccordionTrigger>Why does ARC have admin access?</AccordionTrigger>
        <AccordionContent>
          <p>
            Admin features are used strictly as a <strong>last resort</strong> in cases of technical failures, artist succession issues, 
            or other critical interventions. ARC does not interfere with artist-owned contracts unless necessary to support the integrity 
            of the ecosystem.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">Getting Started</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="create-arc-contract">
        <AccordionTrigger>How can I create an ARC contract?</AccordionTrigger>
        <AccordionContent>
          <p>
            Artists can deploy their ARC contract through the <strong>ARC Dashboard</strong>, where they can mint ARTs and manage their catalog.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="cost-to-use">
        <AccordionTrigger>How much does it cost to use ARC?</AccordionTrigger>
        <AccordionContent>
          <p>
            The cost depends on blockchain transaction fees and the number of ARTs minted. ARC does not charge intermediary fees—artists 
            retain full control.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="supported-blockchains">
        <AccordionTrigger>Which blockchains does ARC support?</AccordionTrigger>
        <AccordionContent>
          <p>
            ARC is designed for interoperability and currently supports <strong>Ethereum, Optimism, and Base</strong>, with future expansion planned.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">Technical & Security</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="is-arc-decentralized">
        <AccordionTrigger>Is ARC decentralized?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes, ARC operates on a decentralized architecture where each artist maintains control over their own smart contract, 
            ensuring that provenance records remain tamper-proof and independent.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="verify-authenticity">
        <AccordionTrigger>How is the authenticity of an ART verified?</AccordionTrigger>
        <AccordionContent>
          <p>
            Collectors and institutions can verify an ART by cross-referencing the <strong>ART Stamp</strong> on the physical artwork 
            with the on-chain metadata.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="can-art-be-burned">
        <AccordionTrigger>Can an ART be burned?</AccordionTrigger>
        <AccordionContent>
          <p>
            An ART can only be burned if the artist includes this functionality in their contract. However, burning an ART would sever 
            its link to the physical artwork.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
  
  <section class="mb-12">
    <h2 class="text-xl font-bold mb-4">Support & Contact</h2>
    
    <Accordion class="w-full">
      <AccordionItem value="get-help">
        <AccordionTrigger>Where can I get help?</AccordionTrigger>
        <AccordionContent>
          <p>
            For support, visit our <a href="#" class="text-blue-600 hover:underline">Help Center</a>, or reach out to the ARC team via 
            <a href="#" class="text-blue-600 hover:underline">Contact Form</a>.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="community">
        <AccordionTrigger>Is there a community for ARC users?</AccordionTrigger>
        <AccordionContent>
          <p>
            Yes! Join our <a href="#" class="text-blue-600 hover:underline">Discord</a> / 
            <a href="#" class="text-blue-600 hover:underline">Forum</a> / 
            <a href="#" class="text-blue-600 hover:underline">Telegram</a> to connect with other artists, collectors, and institutions using ARC.
          </p>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </section>
</div> 