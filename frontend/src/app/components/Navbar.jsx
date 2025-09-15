"use client";

import React, { useState } from "react";
import { useWallet } from "../contexts/WalletContext";
import { Sparkles, Menu } from "lucide-react";
import Sidebar from "./Sidebar";

function Navbar() {
    const { account, connectWallet, isConnecting } = useWallet();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => setSidebarOpen((prev) => !prev);

    let buttonText = "Connect Wallet";
    if (isConnecting) {
        buttonText = "Connecting...";
    } else if (account) {
        buttonText = `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`;
    }

    return (
        <>
            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Blur overlay when sidebar is open */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Navbar */}
            <div className="flex justify-between items-center px-6 py-4 bg-white shadow-md z-40 relative">
                {/* Left: Hamburger + Logo */}
                <div className="flex items-center space-x-3">
                    <Menu
                        className="text-gray-700 cursor-pointer"
                        size={24}
                        onClick={toggleSidebar}
                    />
                    <Sparkles
                        className="text-indigo-500"
                        size={28}
                    />
                    <h1 className="text-2xl font-bold text-gray-800 font-mono">
                        Kaia Remittance
                    </h1>
                </div>

                {/* Wallet Button */}
                <button
                    onClick={connectWallet}
                    className={`px-5 py-2 font-semibold text-sm rounded-xl transition-all duration-300 shadow ${
                        account
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : isConnecting
                            ? "bg-yellow-500 text-black cursor-not-allowed"
                            : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                    disabled={isConnecting}
                >
                    {buttonText}
                </button>
            </div>
        </>
    );
}

export default Navbar;
