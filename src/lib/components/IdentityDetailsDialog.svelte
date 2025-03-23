<script lang="ts">
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { goto } from '$app/navigation';
    import type { UserIdentity } from '$lib/services/userIdentityService';
    import { fetchChainInfo } from '$lib/services/chainService';

    export let open = false;
    export let identity: UserIdentity | null = null;

    function handleEdit() {
        if (identity) {
            goto(`/dashboard/update-identity?id=${identity.id}`);
        }
    }
</script>

<Dialog bind:open>
    <DialogContent class="max-w-2xl">
        <DialogHeader>
            <DialogTitle>Identity Details</DialogTitle>
        </DialogHeader>

        {#if identity}
            <div class="space-y-6">
                <!-- Profile Image and Basic Information -->
                <div class="flex flex-col md:flex-row gap-6">
                    <!-- Profile Image -->
                    <div class="flex-shrink-0">
                        <div class="w-32 h-32 rounded-lg overflow-hidden bg-muted">
                            {#if identity.identity_image}
                                <img src={identity.identity_image} alt={identity.name} class="w-full h-full object-cover" />
                            {:else}
                                <div class="w-full h-full flex items-center justify-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            {/if}
                        </div>
                    </div>

                    <!-- Basic Information -->
                    <div class="flex-1 space-y-4">
                        <h3 class="text-lg font-semibold">Basic Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <p class="text-sm text-muted-foreground">Name</p>
                                <p class="font-medium">{identity.name}</p>
                            </div>
                            <div class="space-y-2">
                                <p class="text-sm text-muted-foreground">Type</p>
                                <p class="font-medium capitalize">{identity.type}</p>
                            </div>
                            <div class="space-y-2">
                                <p class="text-sm text-muted-foreground">Chain</p>
                                <div class="flex items-center gap-2">
                                    {#if identity.chain_id}
                                        {#await fetchChainInfo(identity.chain_id) then chainInfo}
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
                                            <span class="font-medium">{chainInfo.name}</span>
                                        {/await}
                                    {:else}
                                        <span class="text-muted-foreground">-</span>
                                    {/if}
                                </div>
                            </div>
                            <div class="space-y-2">
                                <p class="text-sm text-muted-foreground">Created Date</p>
                                <p class="font-medium">
                                    {identity.created_at ? new Date(identity.created_at).toLocaleDateString() : '-'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Description -->
                <div class="space-y-2">
                    <p class="text-sm text-muted-foreground">Description</p>
                    <p class="whitespace-pre-wrap">{identity.description || '-'}</p>
                </div>

                <!-- Type-specific Information -->
                {#if identity.type === 'artist'}
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold">Artist Information</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <p class="text-sm text-muted-foreground">Date of Birth</p>
                                <p class="font-medium">
                                    {identity.dob ? new Date(identity.dob * 1000).toLocaleDateString() : '-'}
                                </p>
                            </div>
                            <div class="space-y-2">
                                <p class="text-sm text-muted-foreground">Location</p>
                                <p class="font-medium">{identity.location || '-'}</p>
                            </div>
                        </div>
                    </div>
                {:else if identity.type === 'gallery' || identity.type === 'institution'}
                    <div class="space-y-4">
                        <h3 class="text-lg font-semibold">{identity.type === 'gallery' ? 'Gallery' : 'Institution'} Information</h3>
                        <div class="space-y-2">
                            <p class="text-sm text-muted-foreground">Addresses</p>
                            {#if identity.addresses && identity.addresses.length > 0}
                                <ul class="list-disc pl-4 space-y-1">
                                    {#each identity.addresses as address}
                                        <li>{address}</li>
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
                    <h3 class="text-lg font-semibold">Links</h3>
                    {#if identity.links && identity.links.length > 0}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {#each identity.links as link}
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    class="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                                >
                                    <span class="font-medium">{link.name}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
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
                    <h3 class="text-lg font-semibold">Tags</h3>
                    {#if identity.tags && identity.tags.length > 0}
                        <div class="flex flex-wrap gap-2">
                            {#each identity.tags as tag}
                                <span class="inline-flex items-center px-2 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                                    {tag}
                                </span>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-muted-foreground">No tags available</p>
                    {/if}
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-6">
                <Button variant="outline" on:click={() => open = false}>Close</Button>
                <Button on:click={handleEdit}>Edit Identity</Button>
            </div>
        {:else}
            <p class="text-muted-foreground">No identity selected</p>
        {/if}
    </DialogContent>
</Dialog> 