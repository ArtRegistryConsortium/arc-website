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
    <h2 class="text-lg md:text-xl font-bold mb-3 md:mb-4">Identity Management</h2>
    
    <Accordion class="w-full" multiple>
      <AccordionItem value="what-is-identity">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What is an Identity in the ARC system?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            An <strong>Identity</strong> in the ARC system is a blockchain-verified profile that represents a participant in the art ecosystem. Each identity has a unique ID and is associated with a wallet address, ensuring proper authentication and authorization throughout the system.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="identity-types">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What types of Identities exist in ARC?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">ARC supports four types of identities:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Artist (Type 0):</strong> Creators who deploy their own ART Contracts and mint ARTs.</li>
            <li><strong>Gallery (Type 1):</strong> Entities that represent artists and facilitate art sales.</li>
            <li><strong>Institution (Type 2):</strong> Museums, foundations, and other organizations that exhibit, collect, or preserve art.</li>
            <li><strong>Collector (Type 3):</strong> Individuals or entities who own artworks and their corresponding ARTs.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="identity-info">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What information is stored in an Identity?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">Each Identity contains the following information:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Unique ID:</strong> A unique identifier for the identity.</li>
            <li><strong>Wallet Address:</strong> The blockchain address associated with the identity.</li>
            <li><strong>Type:</strong> Artist, Gallery, Institution, or Collector.</li>
            <li><strong>Name:</strong> Full name or alias of the identity.</li>
            <li><strong>Description:</strong> Brief description of the identity.</li>
            <li><strong>Image:</strong> Profile image stored on Arweave.</li>
            <li><strong>Links:</strong> Website or social media URLs.</li>
            <li><strong>Tags:</strong> Keywords associated with the identity.</li>
            <li><strong>Artist-specific:</strong> Date of birth, date of death (if applicable), and location.</li>
            <li><strong>Gallery/Institution-specific:</strong> Physical addresses.</li>
            <li><strong>Artist-specific:</strong> RepresentedBy - Array of gallery/institution identity IDs representing the artist.</li>
            <li><strong>Gallery/Institution-specific:</strong> RepresentedArtists - Array of artist identity IDs represented by the gallery/institution.</li>
          </ul>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="update-identity">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">Can I update my Identity information?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            Yes, you can update your Identity information at any time. This includes your name, description, image, links, tags, and other relevant details. The update will be recorded on the blockchain, maintaining a history of changes.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="identity-custodian">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">What is a Custodian in the Identity system?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            A <strong>Custodian</strong> is an Identity that has been granted permission to manage another Identity. This is particularly useful for artists who want to delegate management of their Identity and ART Contract to a gallery or representative. Custodians can update the Identity information, mint ARTs, and perform other actions on behalf of the Identity they manage.
          </p>
        </AccordionContent>
      </AccordionItem>
      
      <AccordionItem value="representation-relationship">
        <AccordionTrigger class="text-base md:text-lg font-medium text-left">How does the representation relationship work between artists and galleries/institutions?</AccordionTrigger>
        <AccordionContent>
          <p class="text-sm md:text-base">
            The ARC system tracks representation relationships between artists and galleries/institutions through two fields:
          </p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>RepresentedBy:</strong> For artist identities, this field contains an array of gallery/institution identity IDs that represent the artist. This makes it easy to see which galleries or institutions are officially representing an artist.</li>
            <li><strong>RepresentedArtists:</strong> For gallery/institution identities, this field contains an array of artist identity IDs that the gallery/institution represents. This provides a clear roster of artists associated with a gallery or institution.</li>
          </ul>
          <p class="mt-2 text-sm md:text-base">
            These relationships can be established or removed by either party and provide transparency about professional relationships in the art world. They are distinct from the Custodian relationship, which grants specific permissions for managing identities and contracts.
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
            <li><span class="font-semibold">Artist Identity ID:</span> The unique identifier linking to the artist's identity in the Identity Contract.</li>
            <li><span class="font-semibold">Title:</span> The name of the artwork.</li>
            <li><span class="font-semibold">Description:</span> A detailed description of the artwork, its context, and significance.</li>
            <li><span class="font-semibold">Year of Creation:</span> The year the artwork was completed.</li>
            <li><span class="font-semibold">Medium:</span> Materials used to create the artwork (e.g., "oil on canvas," "bronze sculpture").</li>
            <li><span class="font-semibold">Dimensions:</span> Size of the artwork, listed as height x width x depth (in cm or inches).</li>
            <li><span class="font-semibold">Edition:</span> If the artwork is part of an edition, include the edition number and total editions (e.g., "1/10").</li>
            <li><span class="font-semibold">Series:</span> A label used to group artworks that belong to the same thematic or conceptual body of work.</li>
            <li><span class="font-semibold">Catalogue Inventory:</span> A unique identifier assigned to the artwork within the artist's personal registry (e.g., ART-2024-001).</li>
            <li><span class="font-semibold">Image:</span> A high-resolution image or scan of the artwork stored on Arweave.</li>
            <li><span class="font-semibold">Sales Information:</span> JSON string containing price, buyer address, and date of sale transactions.</li>
            <li><span class="font-semibold">Certification Method:</span> How the artwork is linked to the ART (e.g., NFC chip, QR code, token ID inscribed).</li>
            <li><span class="font-semibold">Exhibition History:</span> JSON string containing an array of exhibitions with name, date, and location.</li>
            <li><span class="font-semibold">Condition Reports:</span> JSON string containing an array of reports with date and description of the artwork's condition.</li>
            <li><span class="font-semibold">Artist Statement:</span> A brief description or intention behind the artwork, written by the artist.</li>
            <li><span class="font-semibold">Bibliography:</span> JSON string containing an array of references with title, author, and page.</li>
            <li><span class="font-semibold">Keywords:</span> An array of themes, styles, or movements related to the artwork.</li>
            <li><span class="font-semibold">Location / Collection:</span> JSON string containing location and collection information where the artwork resides.</li>
            <li><span class="font-semibold">Status:</span> Current status of the artwork (e.g., Available, Not Available, On Loan).</li>
            <li><span class="font-semibold">Note:</span> Additional information relevant to the artwork that doesn't fit in other fields.</li>
            <li><span class="font-semibold">Royalties:</span> Percentage of resale royalties set by the artist (in basis points, e.g., 1000 = 10%).</li>
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
          <p class="text-sm md:text-base">ARC contracts implement role-based access control tied to Identities (via Identity ID), not wallet addresses:</p>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            <li><strong>Full Admin (ARC Team):</strong> Can add/remove other Full Admins, upgrade contracts, modify Identity Contract storage, add/remove roles on any contract, mint/update/transfer ART on any contract, and set royalties on any ART or ART Contract.</li>
            <li><strong>Art Contract Owner (Artist):</strong> Can transfer ownership of their ART Contract to another Identity ID, grant/remove roles, and mint/update ART and set royalties in their ART Contract.</li>
            <li><strong>Custodian:</strong> Can update their assigned Identity or ART Contract, mint/update ART and set royalties in their assigned ART Contract, and assign roles to others.</li>
            <li><strong>Minter:</strong> Can mint and update ART in their assigned ART Contract (no royalty control).</li>
            <li><strong>Full Editor:</strong> Can update all ART in their assigned ART Contract (no royalty control).</li>
            <li><strong>Partial Editor:</strong> Can update specific ART tokens they are assigned to (no royalty control).</li>
            <li><strong>Everyone:</strong> Can update their own Identity and own/transfer ART tokens they own.</li>
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