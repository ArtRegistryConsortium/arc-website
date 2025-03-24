<script lang="ts">
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { goto } from '$app/navigation';
    import type { UserIdentity } from '$lib/services/userIdentityService';
    import { fetchChainInfo } from '$lib/services/chainService';
    import { onMount } from 'svelte';

    export let open = false;
    export let identity: UserIdentity | null = null;

    // Parsed data
    let parsedLinks: { name: string; url: string }[] = [];
    let parsedAddresses: string[] = [];

    // Parse links when identity changes
    $: if (identity && identity.links) {
        try {
            // Check if links is already an array or needs to be parsed from JSON string
            if (typeof identity.links === 'string') {
                parsedLinks = JSON.parse(identity.links);
            } else if (Array.isArray(identity.links)) {
                parsedLinks = identity.links;
            } else {
                parsedLinks = [];
            }
            console.log('Parsed links:', parsedLinks);
        } catch (error) {
            console.error('Error parsing links:', error);
            parsedLinks = [];
        }
    } else {
        parsedLinks = [];
    }

    // Parse addresses when identity changes
    $: if (identity && identity.addresses) {
        try {
            // Check if addresses is already an array or needs to be parsed from JSON string
            if (typeof identity.addresses === 'string') {
                parsedAddresses = JSON.parse(identity.addresses);
            } else if (Array.isArray(identity.addresses)) {
                parsedAddresses = identity.addresses;
            } else {
                parsedAddresses = [];
            }
            console.log('Parsed addresses:', parsedAddresses);
        } catch (error) {
            console.error('Error parsing addresses:', error);
            parsedAddresses = [];
        }
    } else {
        parsedAddresses = [];
    }

    function handleEdit() {
        if (identity) {
            goto(`/dashboard/update-identity?id=${identity.id}&chainId=${identity.chain_id}`);
        }
    }
</script>

<Dialog bind:open>
    <DialogContent class="max-w-2xl bg-background max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-400/50 dark:scrollbar-thumb-neutral-900/90 scrollbar-track-transparent hover:scrollbar-thumb-neutral-500/50 dark:hover:scrollbar-thumb-neutral-800/90">
        <DialogHeader class="pb-4">
            <DialogTitle class="text-2xl font-bold">{identity?.name || 'Identity Details'}</DialogTitle>
        </DialogHeader>

        {#if identity}
            <div class="space-y-8 pt-2 pb-4">
                <!-- Profile Image and Basic Information -->
                <div class="flex flex-col md:flex-row gap-8">
                    <!-- Profile Image -->
                    <div class="flex-shrink-0">
                        <div class="w-40 h-40 rounded-xl overflow-hidden bg-muted/50 ring-1 ring-border/50 shadow-sm hover:shadow-md transition-all duration-200">
                            {#if identity.identity_image}
                                <img
                                    src={identity.identity_image}
                                    alt={identity.name}
                                    class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                                />
                            {:else}
                                <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Basic Information -->
                    <div class="flex-1 space-y-6">
                        <div class="space-y-4">
                            <h3 class="text-lg font-semibold text-foreground/90">Basic Information</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-2">
                                    <p class="text-sm font-medium text-muted-foreground">Name</p>
                                    <p class="text-base font-semibold">{identity.name}</p>
                                </div>
                                <div class="space-y-2">
                                    <p class="text-sm font-medium text-muted-foreground">Type</p>
                                    <p class="text-base font-semibold capitalize">{identity.type}</p>
                                </div>
                                <div class="space-y-2">
                                    <p class="text-sm font-medium text-muted-foreground">Date of Birth</p>
                                    <p class="text-base font-semibold">
                                        {identity.dob ? new Date(identity.dob * 1000).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                                <div class="space-y-2">
                                    <p class="text-sm font-medium text-muted-foreground">Date of Death</p>
                                    <p class="text-base font-semibold">
                                        {identity.dod && identity.dod > 0 ? new Date(identity.dod * 1000).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="space-y-3">
                    <h3 class="text-lg font-semibold text-foreground/90">Description</h3>
                    <div class="bg-muted/30 rounded-lg p-4">
                        <p class="whitespace-pre-wrap text-foreground/80">{identity.description || '-'}</p>
                    </div>
                </div>

                <!-- Type-specific Information -->
                {#if identity.type === 'artist'}
                    <div class="space-y-4">
                        <p class="text-sm font-medium text-muted-foreground">Location</p>
                        <p class="text-base font-semibold">{identity.location || '-'}</p>
                    </div>
                {:else if identity.type === 'gallery' || identity.type === 'institution'}
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold text-foreground/90">{identity.type === 'gallery' ? 'Gallery' : 'Institution'} Information</h3>
                        <div class="space-y-2">
                            <p class="text-sm font-medium text-muted-foreground">Addresses</p>
                            {#if parsedAddresses && parsedAddresses.length > 0}
                                <ul class="space-y-2">
                                    {#each parsedAddresses as address}
                                        <li class="flex items-start gap-2 text-foreground/80">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            <span>{address}</span>
                                        </li>
                                    {/each}
                                </ul>
                            {:else}
                                <p class="text-muted-foreground">-</p>
                            {/if}
                        </div>
                    </div>
                {/if}

                <!-- Links -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-foreground/90">Links</h3>
                    {#if parsedLinks && parsedLinks.length > 0}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {#each parsedLinks as link}
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="group flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-border transition-all duration-200"
                                >
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium truncate">{link.name || link.url}</p>
                                        <p class="text-sm text-muted-foreground truncate">{link.url}</p>
                                    </div>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-muted-foreground">No links available</p>
                    {/if}
                </div>

                <!-- Tags -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-foreground/90">Tags</h3>
                    {#if identity.tags && identity.tags.length > 0}
                        <div class="flex flex-wrap gap-2">
                            {#each identity.tags as tag}
                                <span class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary ring-1 ring-primary/20">
                                    {tag}
                                </span>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-muted-foreground">No tags available</p>
                    {/if}
                </div>

                <!-- Blockchain Information -->
                <div class="space-y-4 pt-4 border-t border-border/50">
                    <h3 class="text-lg font-semibold text-foreground/90">Blockchain Information</h3>
                    <div class="bg-muted/30 rounded-lg p-4 space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <p class="text-sm font-medium text-muted-foreground">Chain</p>
                                <div class="flex items-center gap-2">
                                    {#if identity.chain_id}
                                        {#await fetchChainInfo(identity.chain_id) then chainInfo}
                                            <div class="flex items-center gap-2 bg-background/50 px-3 py-2 rounded-md w-full">
                                                {#if chainInfo.icon_url}
                                                    <img
                                                        src={chainInfo.icon_url}
                                                        alt={chainInfo.name}
                                                        class="w-5 h-5"
                                                        on:error={(e) => {
                                                            const img = e.target as HTMLImageElement;
                                                            img.onerror = null;
                                                            img.src = `https://placehold.co/20x20/svg?text=${identity.chain_id}`;
                                                        }}
                                                    />
                                                {:else}
                                                    <div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-xs">
                                                        {identity.chain_id}
                                                    </div>
                                                {/if}
                                                <span class="font-medium text-sm">{chainInfo.name}</span>
                                            </div>
                                        {/await}
                                    {:else}
                                        <span class="text-muted-foreground">-</span>
                                    {/if}
                                </div>
                            </div>
                            <div class="space-y-2">
                                <p class="text-sm font-medium text-muted-foreground">Identity ID</p>
                                <div class="bg-background/50 rounded-md p-2">
                                    <p class="text-sm font-mono break-all text-foreground/80">{identity.id || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <p class="text-sm font-medium text-muted-foreground">Wallet Address</p>
                                <div class="bg-background/50 rounded-md p-2">
                                    <p class="text-sm font-mono break-all text-foreground/80">{identity.wallet_address || '-'}</p>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <p class="text-sm font-medium text-muted-foreground">Created Date</p>
                                <div class="bg-background/50 rounded-md p-2">
                                    <p class="text-sm font-mono text-foreground/80">
                                        {identity.created_at ? new Date(identity.created_at).toLocaleDateString() : '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" on:click={() => open = false}>Close</Button>
                <Button on:click={handleEdit}>Edit Identity</Button>
            </div>
        {:else}
            <div class="flex flex-col items-center justify-center py-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-muted-foreground/50 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p class="text-muted-foreground">No identity selected</p>
            </div>
        {/if}
    </DialogContent>
</Dialog>

<style>
    /* Additional dark mode scrollbar styling specific to this component */
    :global(.dark .scrollbar-thin::-webkit-scrollbar) {
        width: 9px;
    }

    :global(.dark .scrollbar-thin::-webkit-scrollbar-track) {
        background: transparent;
    }

    :global(.dark .scrollbar-thin::-webkit-scrollbar-thumb) {
        background-color: rgba(32, 32, 34, 0.65); /* Dark gray with minimal blue tint */
        border-radius: 4px;
    }

    :global(.dark .scrollbar-thin::-webkit-scrollbar-thumb:hover) {
        background-color: rgba(45, 45, 48, 0.75); /* Slightly lighter with minimal blue tint on hover */
    }
</style>