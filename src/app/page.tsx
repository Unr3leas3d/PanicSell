"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState, useMemo } from "react";
import { getWalletAssets, Asset } from "@/utils/helius";
import { fetchJupiterQuote, WSOL_MINT } from "@/utils/jupiter";
import AssetList from "@/components/AssetList";
import PanicControl from "@/components/PanicControl";
import * as Switch from "@radix-ui/react-switch";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { motion } from "framer-motion";

export default function Home() {
    const { publicKey } = useWallet();
    const { connection } = useConnection();
    const [mounted, setMounted] = useState(false);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(false);

    // Valuation states
    const [dumpSol, setDumpSol] = useState(false);
    const [solBalance, setSolBalance] = useState(0); // in lamports
    const [quotes, setQuotes] = useState<Record<string, number>>({});
    const [rawQuotes, setRawQuotes] = useState<Record<string, any>>({});
    const [valuing, setValuing] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (publicKey) {
            fetchData(publicKey.toBase58());
        } else {
            setAssets([]);
            setSolBalance(0);
            setQuotes({});
            setRawQuotes({});
        }
    }, [publicKey]);

    const fetchData = async (address: string) => {
        setLoading(true);
        try {
            // 1. Fetch SOL Balance
            const balance = await connection.getBalance(publicKey!);
            setSolBalance(balance);

            // 2. Fetch SPL Tokens from Helius
            const data = await getWalletAssets(address);
            setAssets(data);

            // 3. Fetch Jupiter Quotes
            setValuing(true);
            const newQuotes: Record<string, number> = {};
            const newRawQuotes: Record<string, any> = {};

            // Get quote for SOL if balance > 0
            if (balance > 0) {
                const solQuote = await fetchJupiterQuote(WSOL_MINT, balance);
                if (solQuote) {
                    newQuotes[WSOL_MINT] = solQuote.outAmount / 1_000_000; // USDC has 6 decimals
                    newRawQuotes[WSOL_MINT] = solQuote;
                }
            }

            // Get quotes for all tokens
            await Promise.all(data.map(async (asset) => {
                const amount = asset.token_info?.balance || 0;
                if (amount > 0) {
                    const quote = await fetchJupiterQuote(asset.id, amount);
                    if (quote) {
                        newQuotes[asset.id] = quote.outAmount / 1_000_000;
                        newRawQuotes[asset.id] = quote;
                    }
                }
            }));

            setQuotes(newQuotes);
            setRawQuotes(newRawQuotes);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
            setValuing(false);
        }
    };

    const totalValue = useMemo(() => {
        let total = 0;
        // Sum up tokens
        assets.forEach(asset => {
            if (quotes[asset.id]) total += quotes[asset.id];
        });
        // Add SOL if dumpSol is true
        if (dumpSol && quotes[WSOL_MINT]) {
            total += quotes[WSOL_MINT];
        }
        return total;
    }, [assets, quotes, dumpSol]);

    if (!mounted) return null;

    return (
        <main className="flex min-h-screen flex-col items-center bg-zinc-950 text-white p-4 md:p-8">
            <div className="z-10 w-full max-w-2xl flex flex-col items-center gap-8 mt-8">
                {/* Header Section */}
                <div className="flex flex-col items-center gap-4">
                    <motion.h1
                        animate={{
                            x: [-2, 2, -2, 2, 0],
                            y: [-1, 1, -1, 1, 0],
                            rotate: [-1, 1, -1, 1, 0]
                        }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatType: "mirror"
                        }}
                        className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-center text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]"
                    >
                        PANIC SELL
                    </motion.h1>
                    <p className="text-center text-red-300 text-lg md:text-xl font-mono uppercase tracking-widest bg-red-950/20 px-4 py-1 rounded-full border border-red-900/30">
                        Liquidate everything. Save yourself.
                    </p>
                </div>

                {/* Main Action Section */}
                <div className="border border-red-900/50 rounded-2xl p-6 md:p-8 bg-red-950/20 w-full flex flex-col items-center gap-6 backdrop-blur-sm">
                    <div className="w-full flex justify-center">
                        <WalletMultiButton style={{ backgroundColor: '#ef4444', borderRadius: '12px', height: '50px', padding: '0 24px' }} />
                    </div>

                    {publicKey && (
                        <div className="w-full flex flex-col items-center gap-6">
                            <div className="text-center w-full bg-red-950/30 py-6 rounded-xl border border-red-900/30">
                                <div className="text-xs text-red-400/80 uppercase tracking-[0.2em] mb-2 font-bold">Total Liquidation Value</div>
                                <div className="text-5xl md:text-6xl font-black text-red-500 tracking-tighter drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                    {valuing ? "..." : `$${totalValue.toFixed(2)}`}
                                </div>
                            </div>

                            <div className="flex items-center justify-between w-full bg-red-900/20 px-4 py-3 rounded-xl border border-red-900/40">
                                <label className="text-sm font-bold text-red-200 cursor-pointer" htmlFor="dump-sol">
                                    Include SOL Balance? ({(solBalance / LAMPORTS_PER_SOL).toFixed(4)} SOL)
                                </label>
                                <Switch.Root
                                    id="dump-sol"
                                    checked={dumpSol}
                                    onCheckedChange={setDumpSol}
                                    className="w-[48px] h-[28px] bg-red-950 rounded-full relative shadow-inner focus:ring-2 focus:ring-red-500 data-[state=checked]:bg-red-600 outline-none cursor-pointer border border-red-900 transition-colors"
                                >
                                    <Switch.Thumb className="block w-[22px] h-[22px] bg-white rounded-full shadow-lg transition-transform duration-200 translate-x-0.5 will-change-transform data-[state=checked]:translate-x-[24px]" />
                                </Switch.Root>
                            </div>

                            <PanicControl
                                assets={assets}
                                dumpSol={dumpSol}
                                quotes={rawQuotes}
                                totalValue={totalValue}
                                onComplete={() => fetchData(publicKey.toBase58())}
                            />
                        </div>
                    )}
                </div>

                {/* Risk Assessment: Asset List Section */}
                <div className="w-full bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 backdrop-blur-sm mb-12">
                    <div className="p-4 border-b border-zinc-800 text-[10px] uppercase tracking-[0.2em] text-zinc-500 flex justify-between font-bold bg-zinc-900/80">
                        <span>Risk Assessment: Your Bags</span>
                        <span>{assets.length} items detected</span>
                    </div>
                    <div className="p-2">
                        <AssetList assets={assets} loading={loading} />
                    </div>
                </div>
            </div>
        </main>
    );
}
