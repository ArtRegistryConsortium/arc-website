export interface ChainInfo {
    name: string;
    icon_url?: string;
}

export async function fetchChainInfo(chainId: number): Promise<ChainInfo> {
    try {
        const response = await fetch(`/api/chains/info?chainId=${chainId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch chain info');
        }
        const data = await response.json();
        if (data.success && data.chain) {
            return data.chain;
        }
        throw new Error('Invalid chain info response');
    } catch (error) {
        console.error('Error fetching chain info:', error);
        return {
            name: `Chain ${chainId}`,
            icon_url: `https://placehold.co/20x20/svg?text=${chainId}`
        };
    }
} 