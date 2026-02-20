export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const WSOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Fetches a quote from Jupiter for a single token to USDC
 * @param inputMint The SPL token mint
 * @param amount The raw token amount (including decimals)
 */
export async function fetchJupiterQuote(inputMint: string, amount: number) {
    if (amount <= 0) return null;

    try {
        const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${USDC_MINT}&amount=${amount}&slippageBps=50`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.warn(`Jupiter quote error for ${inputMint}:`, data.error);
            return null;
        }

        return data; // contains `outAmount` (USDC, 6 decimals)
    } catch (error) {
        console.error("Error fetching Jupiter quote:", error);
        return null;
    }
}

/**
 * Fetches the serialized swap transaction from Jupiter
 * @param quoteResponse The response object from fetchJupiterQuote
 * @param userPublicKey The connected wallet's public key (base58)
 */
export async function fetchJupiterSwapTransaction(quoteResponse: any, userPublicKey: string) {
    try {
        const response = await fetch('https://quote-api.jup.ag/v6/swap', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                quoteResponse,
                userPublicKey,
                wrapAndUnwrapSol: true,
                // Optional: For handling dynamic compute unit pricing
                // dynamicComputeUnitLimit: true, 
                // prioritizationFeeLamports: 'auto'
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error("Jupiter swap error:", data.error);
            return null;
        }

        return data.swapTransaction; // This is a base64 encoded string
    } catch (error) {
        console.error("Error fetching Jupiter swap transaction:", error);
        return null;
    }
}
