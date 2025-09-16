"use client";
import React, { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext";

type BalanceResponse = {
    address: string;
    token: string;
    balance: string;
};

const TOKENS = ["USDT", "USDC", "DAI"]; // Add tokens you support

export default function Balances() {
    const { account } = useWallet();
    const [balances, setBalances] = useState<BalanceResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!account) return;

        const fetchBalances = async () => {
            setLoading(true);
            try {
                const results = await Promise.all(
                    TOKENS.map(async (token) => {
                        const res = await fetch(
                            `http://localhost:3001/balance/${account}/${token}`
                        );
                        if (!res.ok)
                            throw new Error(`Failed to fetch ${token}`);
                        return res.json();
                    })
                );
                setBalances(results);
            } catch (error) {
                console.error("Error fetching balances:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalances();
    }, [account]);

    if (!account) {
        return (
            <div className="p-4 text-center text-gray-600">
                Please connect your wallet to see balances.
            </div>
        );
    }

    return (
        <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">💰 Token Balances</h2>

            {loading ? (
                <p className="text-gray-600">Fetching balances...</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {balances.map(({ token, balance }) => (
                        <div
                            key={token}
                            className="rounded-2xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition"
                        >
                            <h3 className="text-lg font-semibold">{token}</h3>
                            <p className="text-xl font-mono">{balance}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
