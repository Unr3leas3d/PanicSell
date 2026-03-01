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
    try {
        const response = await fetch(`/api/assets?owner=${owner}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const { result } = await response.json();

        // Filter for fungible tokens with positive balance
        return (result?.items || []).filter((asset: Asset) =>
            asset.token_info && asset.token_info.balance > 0
        );
    } catch (error) {
        console.error("Error fetching assets via proxy:", error);
        return [];
    }
}
