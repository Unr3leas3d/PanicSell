"use client";

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { fetchJupiterSwapTransaction } from "@/utils/jupiter";
import { Asset } from "@/utils/helius";
import { motion, AnimatePresence } from "framer-motion";
import { playAlarm, playSuccess, stopSound } from "@/utils/audio";

interface PanicControlProps {
    assets: Asset[];
    dumpSol: boolean;
    quotes: Record<string, any>; // quoteResponses from Jupiter
    totalValue: number;
    onComplete?: () => void;
}

export default function PanicControl({ assets, dumpSol, quotes, totalValue, onComplete }: PanicControlProps) {
    const { publicKey, signAllTransactions } = useWallet();
    const { connection } = useConnection();

    const [open, setOpen] = useState(false);
    const [running, setRunning] = useState(false);
    const [logs, setLogs] = useState<{ id: number; message: string; type: "info" | "success" | "error" }[]>([]);

    // Ensure sound stops if component unmounts
    useEffect(() => {
        return () => stopSound();
    }, []);

    // Stop sound if modal is closed
    useEffect(() => {
        if (!open && !running) {
            stopSound();
        }
    }, [open, running]);

    const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
        setLogs(prev => [...prev, { id: Date.now() + Math.random(), message, type }]);
    };

    const handlePanic = async () => {
        if (!publicKey || !signAllTransactions) {
            addLog("Wallet error: Please reconnect.", "error");
            return;
        }

        setRunning(true);
        playAlarm();
        addLog("INITIATING PANIC SELL PROTOCOL...", "info");

        try {
            // 1. Gather all quotes to execute
            const quotesToExecute = [];
            for (const asset of assets) {
                if (quotes[asset.id]) {
                    quotesToExecute.push({ mint: asset.id, symbol: asset.content.metadata.symbol, quoteResponse: quotes[asset.id] });
                }
            }

            if (quotesToExecute.length === 0) {
                addLog("No tokens to sell.", "info");
                stopSound();
                setRunning(false);
                return;
            }

            // 2. Fetch swap transactions from Jupiter
            addLog(`Generating ${quotesToExecute.length} swap transactions...`, "info");
            const transactions: VersionedTransaction[] = [];
            const symbols: string[] = [];

            for (const item of quotesToExecute) {
                try {
                    const swapBase64 = await fetchJupiterSwapTransaction(item.quoteResponse, publicKey.toBase58());
                    if (swapBase64) {
                        const swapTransactionBuf = Buffer.from(swapBase64, 'base64');
                        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
                        transactions.push(transaction);
                        symbols.push(item.symbol);
                    } else {
                        addLog(`Failed to generate route for ${item.symbol}`, "error");
                    }
                } catch (e) {
                    addLog(`Error preparing ${item.symbol}`, "error");
                }
            }

            if (transactions.length === 0) {
                addLog("ABORT: Could not build any swap transactions.", "error");
                stopSound();
                setRunning(false);
                return;
            }

            // 3. User signs all transactions at once
            addLog("Please approve in your wallet...", "info");
            const signedTransactions = await signAllTransactions(transactions);
            addLog(`Wallet approved ${signedTransactions.length} transactions.`, "success");

            // 4. Execute transactions
            addLog("Executing swaps on-chain...", "info");
            let successCount = 0;

            for (let i = 0; i < signedTransactions.length; i++) {
                const tx = signedTransactions[i];
                const symbol = symbols[i];
                addLog(`Sending ${symbol}...`, "info");

                try {
                    const rawTransaction = tx.serialize();
                    await connection.sendRawTransaction(rawTransaction, {
                        skipPreflight: true,
                        maxRetries: 2,
                    });

                    addLog(`Successfully sold ${symbol}!`, "success");
                    successCount++;
                } catch (e: any) {
                    console.error("Tx Error:", e);
                    addLog(`Failed to sell ${symbol}`, "error");
                }
            }

            playSuccess();
            addLog("PANIC PROTOCOL COMPLETE.", "success");
            addLog(`Successfully dumped ${successCount}/${quotesToExecute.length} assets.`, "success");

            if (onComplete) {
                setTimeout(onComplete, 2000);
            }

        } catch (error: any) {
            stopSound();
            console.error("Panic sequence failed:", error);
            addLog(`Sequence aborted: ${error.message || 'Unknown error'}`, "error");
        } finally {
            setRunning(false);
        }
    };

    const isReady = publicKey && (assets.length > 0 || dumpSol) && totalValue > 0;

    return (
        <div className="w-full mt-6">
            <Dialog.Root open={open} onOpenChange={(isOpen) => {
                if (!running) setOpen(isOpen);
            }}>
                <Dialog.Trigger asChild>
                    <motion.button
                        disabled={!isReady}
                        animate={isReady ? {
                            x: [-1, 1, -1, 1, 0],
                            y: [-1, 1, -1, 1, 0],
                        } : {}}
                        transition={{
                            duration: 0.2,
                            repeat: Infinity,
                            repeatType: "mirror"
                        }}
                        className="w-full py-6 rounded-2xl bg-red-600 hover:bg-red-500 disabled:bg-red-950 disabled:text-red-900 text-white font-black text-3xl tracking-widest shadow-[0_0_40px_rgba(220,38,38,0.5)] transition-colors active:scale-95 disabled:shadow-none flex flex-col items-center justify-center gap-1"
                    >
                        THE PANIC BUTTON
                        <span className="text-xs font-medium tracking-normal opacity-80 uppercase">
                            Dump everything into USDC
                        </span>
                    </motion.button>
                </Dialog.Trigger>

                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 p-4 flex items-center justify-center overflow-y-auto">
                        <Dialog.Content asChild>
                            <motion.div
                                animate={running ? {
                                    boxShadow: ["0 0 100px rgba(220,38,38,0.2)", "0 0 150px rgba(220,38,38,0.8)", "0 0 100px rgba(220,38,38,0.2)"],
                                    scale: [1, 1.02, 1],
                                } : {}}
                                transition={{ duration: 0.5, repeat: running ? Infinity : 0 }}
                                className="bg-zinc-950 border border-red-900/50 rounded-2xl w-full max-w-md shadow-[0_0_100px_rgba(220,38,38,0.2)] p-6 relative"
                            >
                                {!running && (
                                    <Dialog.Close asChild>
                                        <button className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors" aria-label="Close">
                                            <X size={20} />
                                        </button>
                                    </Dialog.Close>
                                )}

                                <Dialog.Title className="text-2xl font-black text-red-500 mb-2 uppercase tracking-tighter shadow-red-500/50 drop-shadow-md pb-4 border-b border-red-900/30">
                                    Safety Confirmation
                                </Dialog.Title>

                                <Dialog.Description className="text-zinc-300 mt-4 text-sm leading-relaxed mb-6">
                                    You are about to paper hand your entire portfolio. <br /><br />
                                    This will generate roughly <strong>{(assets.filter(a => quotes[a.id]).length) + (dumpSol ? 1 : 0)}</strong> swap transactions to convert your tokens to USDC.<br /><br />
                                    <span className="text-red-400 font-bold text-lg">Estimated Return: ${totalValue.toFixed(2)} USDC</span>
                                </Dialog.Description>

                                {/* Live Panic Log */}
                                <AnimatePresence>
                                    {logs.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 192 }}
                                            className="w-full bg-black rounded-lg border border-red-900/30 p-3 overflow-y-auto mb-6 font-mono text-xs flex flex-col gap-1 custom-scrollbar"
                                        >
                                            {logs.map(log => (
                                                <div key={log.id} className={
                                                    log.type === 'error' ? 'text-red-500 font-bold' :
                                                        log.type === 'success' ? 'text-green-500 font-bold' :
                                                            'text-zinc-400'
                                                }>
                                                    <span className="opacity-50">[{new Date().toLocaleTimeString()}]</span> {log.message}
                                                </div>
                                            ))}
                                            {running && (
                                            <div className="text-red-500/50 animate-pulse mt-2">...</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="flex gap-3 w-full">
                                    {!running ? (
                                        <>
                                            <Dialog.Close asChild>
                                                <button className="flex-1 py-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-bold transition-colors border border-zinc-800">
                                                    CANCEL
                                                </button>
                                            </Dialog.Close>
                                            <button
                                                onClick={handlePanic}
                                                className="flex-1 py-3 rounded-lg bg-red-600 hover:bg-red-500 text-white font-black tracking-widest transition-colors animate-pulse hover:shadow-[0_0_20px_rgba(220,38,38,0.8)]"
                                            >
                                                I'M SURE. PANIC.
                                            </button>
                                        </>
                                    ) : (
                                        <button disabled className="w-full py-3 rounded-lg bg-red-900/50 text-red-200 font-bold uppercase tracking-widest cursor-not-allowed border border-red-800 animate-pulse">
                                            DOOM SWITCH ENGAGED...
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </Dialog.Content>
                    </Dialog.Overlay>
                </Dialog.Portal>
            </Dialog.Root>
        </div>
    );
}
