"use client";

import React, { useState } from "react";

export default function SendFunds() {
    const [recipient, setRecipient] = useState("");
    const [token, setToken] = useState("USDT");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            // Example: Calling your backend
            const res = await fetch(
                "http://localhost:3001/create-transaction",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        // for now we mock intentId (in real case you'd get it from webhook/LIFF)
                        intentId: "demo-intent-id",
                        userAddress: recipient,
                    }),
                }
            );

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Transaction failed");

            setMessage(`✅ Transaction created: ${JSON.stringify(data)}`);
        } catch (err: any) {
            setMessage(`❌ Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-gray-200 p-6 flex flex-col items-center justify-center">
            <div className="w-full max-w-lg rounded-3xl bg-white/80 shadow-2xl backdrop-blur-md p-8 border border-gray-300">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">
                    Send Funds
                </h2>
                <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    {/* Recipient */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Recipient Address
                        </label>
                        <input
                            type="text"
                            value={recipient}
                            onChange={(e) => setRecipient(e.target.value)}
                            placeholder="0x123... or @username"
                            className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                            required
                        />
                    </div>

                    {/* Token */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Token
                        </label>
                        <select
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                        >
                            <option value="USDT">USDT</option>
                            <option value="USDC">USDC</option>
                            <option value="DAI">DAI</option>
                        </select>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Amount
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="Enter amount"
                            className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3"
                            required
                            min="0"
                            step="0.01"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 transition-colors text-white font-semibold text-lg rounded-xl shadow-md focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50"
                    >
                        {loading ? "Processing..." : "Send Funds"}
                    </button>
                </form>

                {/* Message */}
                {message && (
                    <div className="mt-4 text-sm text-center text-gray-700">
                        {message}
                    </div>
                )}
            </div>
        </main>
    );
}
