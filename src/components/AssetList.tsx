"use client";

import React from "react";
import { Asset } from "@/utils/helius";

interface AssetListProps {
    assets: Asset[];
    loading: boolean;
}

export default function AssetList({ assets, loading }: AssetListProps) {
    if (loading) {
        return (
            <div className="w-full h-40 flex items-center justify-center text-zinc-500 animate-pulse">
                Scanning for trash...
            </div>
        );
    }

    if (assets.length === 0) {
        return (
            <div className="w-full h-40 flex items-center justify-center text-zinc-500 italic">
                No tokens found. You're broke or clean.
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {assets.map((asset) => (
                <div
                    key={asset.id}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 border border-zinc-800 rounded-lg hover:border-red-900/50 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        {asset.content.links.image ? (
                            <img
                                src={asset.content.links.image}
                                alt={asset.content.metadata.name}
                                className="w-8 h-8 rounded-full bg-zinc-800"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px]">
                                ?
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="font-bold text-zinc-200">
                                {asset.content.metadata.symbol}
                            </span>
                            <span className="text-[10px] text-zinc-500 truncate max-w-[100px]">
                                {asset.content.metadata.name}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-mono text-zinc-300">
                            {(asset.token_info!.balance / Math.pow(10, asset.token_info!.decimals)).toLocaleString(undefined, { maximumFractionDigits: 4 })}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
