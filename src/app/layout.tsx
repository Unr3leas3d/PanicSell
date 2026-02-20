import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Panic Sell - Paper Hands",
    description: "Liquidate your Solana assets instantly.",
};

import AppWalletProvider from "@/components/WalletProvider";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
            </head>
            <body className="font-sans">
                <AppWalletProvider>
                    {children}
                </AppWalletProvider>
            </body>
        </html>
    );
}
