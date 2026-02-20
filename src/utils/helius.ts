import { PublicKey } from "@solana/web3.js";

export interface Asset {
    id: string;
    content: {
        metadata: {
            name: string;
            symbol: string;
        };
        links: {
            image?: string;
        };
    };
    token_info?: {
        balance: number;
        decimals: number;
        price_info?: {
            total_price: number;
            currency: string;
        };
    };
}

/**
 * Fetches all assets owned by a wallet using Helius DAS API.
 * @param owner The public key of the wallet owner.
 * @returns A list of assets (tokens) with non-zero balances.
 */
export async function getWalletAssets(owner: string): Promise<Asset[]> {
    const rpcUrl = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;

    if (!rpcUrl) {
        console.error("Helius RPC URL is not defined in .env.local");
        return [];
    }

    try {
        const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'my-id',
                method: 'getAssetsByOwner',
                params: {
                    ownerAddress: owner,
                    page: 1,
                    limit: 1000,
                    displayOptions: {
                        showFungible: true,
                        showInscription: false,
                    },
                },
            }),
        });

        const { result } = await response.json();

        // Filter for fungible tokens with positive balance
        return (result.items || []).filter((asset: Asset) =>
            asset.token_info && asset.token_info.balance > 0
        );
    } catch (error) {
        console.error("Error fetching assets from Helius:", error);
        return [];
    }
}
