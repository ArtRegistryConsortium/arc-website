<script lang="ts">
    import { Button } from "$lib/components/ui/button";
</script>

<div class="fixed bottom-0 left-0 right-0 bg-yellow-400/95 dark:bg-yellow-500/95 text-black border-t border-black/10 shadow-lg z-50 backdrop-blur-sm">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center space-x-3 text-xs md:text-sm">
            <div class="flex items-center space-x-2 bg-black/10 px-2 md:px-3 py-1 rounded-full">
                <span class="hidden md:inline animate-pulse">🚧</span>
                <span class="font-medium">ARC is currently in development</span>
            </div>
            <span class="hidden md:inline text-black/80">Join our community to stay updated!</span>
        </div>
        <Button
            variant="outline"
            size="sm"
            class="bg-white/90 hover:bg-white text-black hover:text-black border-black/20 hover:border-black transition-colors duration-200 ml-2 md:ml-0"
            onclick={() => window.open('https://discord.com/invite/kNmQCnNWSp', '_blank')}
        >
            Join Discord
        </Button>
    </div>
</div> 