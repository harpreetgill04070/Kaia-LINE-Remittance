import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "./components/Navbar";
import { ContractProvider } from "./contexts/ContractContext";
import { WalletProvider } from "./contexts/WalletContext";

import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Kaia-Remittance",
    description: "Sending remittance using USDT",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <WalletProvider>
                    <ContractProvider>
                        <div className="relative h-screen w-screen">
                            <div className="relative flex flex-col flex-1 transition-all overflow-auto">
                                <Navbar />
                                <main className="">{children}</main>
                            </div>
                        </div>
                    </ContractProvider>
                </WalletProvider>
            </body>
        </html>
    );
}
