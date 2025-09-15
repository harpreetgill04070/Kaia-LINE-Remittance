"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

export const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);

    // Connect to Metamask
    // Connect to Metamask and switch to Sepolia
    const connectWallet = async () => {
        if (typeof window.ethereum === "undefined") {
            alert("MetaMask is not installed!");
            return;
        }

        setIsConnecting(true);

        try {
            // Step 1: Request account access
            const accounts = await window.ethereum.request({
                method: "eth_requestAccounts",
            });

            setAccount(accounts[0]);

            // Step 2: Switch to Sepolia
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0xAA36A7" }], // Sepolia chain ID in hex
            });
        } catch (error) {
            // Step 3: If Sepolia is not added, add it
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: "0xAA36A7",
                                chainName: "Sepolia Test Network",
                                rpcUrls: ["https://rpc.sepolia.org"],
                                nativeCurrency: {
                                    name: "Sepolia ETH",
                                    symbol: "SEP",
                                    decimals: 18,
                                },
                                blockExplorerUrls: [
                                    "https://sepolia.etherscan.io",
                                ],
                            },
                        ],
                    });
                } catch (addError) {
                    console.error("Failed to add Sepolia network:", addError);
                    alert("Please add the Sepolia network manually.");
                }
            } else {
                console.error("Error connecting wallet:", error);
            }
        } finally {
            setIsConnecting(false);
        }
    };

    // Auto-connect on reload (if already connected)
    useEffect(() => {
        connectWallet();
    }, []);

    // Listen for account changes
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                if (accounts.length === 0) {
                    setAccount(null);
                } else {
                    setAccount(accounts[0]);
                }
            };

            window.ethereum.on("accountsChanged", handleAccountsChanged);

            return () => {
                window.ethereum.removeListener(
                    "accountsChanged",
                    handleAccountsChanged
                );
            };
        }
    }, []);

    return (
        <WalletContext.Provider
            value={{ account, connectWallet, isConnecting }}
        >
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
