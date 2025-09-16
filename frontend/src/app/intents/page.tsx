"use client";
import { useEffect, useState } from "react";
import { useWallet } from "../contexts/WalletContext"; // adjust path if different

interface Intent {
    amount: number;
    token: string;
    recipient: string;
    createdAt: string;
    status: string;
}

export default function IntentPage() {
    const { account, connectWallet, isConnecting } = useWallet();
    const [intents, setIntents] = useState<{ [key: string]: Intent }>({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        async function fetchIntents() {
            try {
                const res = await fetch("http://localhost:3001/intents");
                const data = await res.json();
                setIntents(data);
            } catch (error) {
                console.error("Failed to fetch intents", error);
            } finally {
                setLoading(false);
            }
        }
        fetchIntents();
    }, []);

    const handleCreateTx = async (intentId: string) => {
        if (!account) {
            setMessage("⚠️ Please connect your wallet first.");
            return;
        }

        try {
            const res = await fetch(
                "http://localhost:3001/create-transaction",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ intentId, userAddress: account }),
                }
            );

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Transaction failed");
            }

            const data = await res.json();
            setMessage(`✅ Transaction created: ${JSON.stringify(data)}`);
        } catch (error: any) {
            setMessage(`❌ Error: ${error.message}`);
        }
    };

    return (
        <main className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-gray-200 p-6">
            <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-lg p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">
                    📜 Remittance Intents
                </h1>

                {/* Wallet connection status */}
                <div className="mb-6 flex items-center justify-between">
                    {account ? (
                        <p className="text-gray-700">
                            Connected wallet:{" "}
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                {account}
                            </span>
                        </p>
                    ) : (
                        <button
                            onClick={connectWallet}
                            disabled={isConnecting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            {isConnecting ? "Connecting..." : "Connect Wallet"}
                        </button>
                    )}
                </div>

                {message && (
                    <div className="mb-6 text-sm text-gray-700 bg-gray-100 border border-gray-300 p-3 rounded-lg">
                        {message}
                    </div>
                )}

                {loading ? (
                    <p className="text-gray-600">Loading intents...</p>
                ) : Object.keys(intents).length === 0 ? (
                    <p className="text-gray-600">No intents found.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
                            <thead className="bg-gray-200 text-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        Amount
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Token
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Recipient
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Status
                                    </th>
                                    <th className="px-4 py-2 text-left">
                                        Created
                                    </th>
                                    <th className="px-4 py-2">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(intents).map(([id, intent]) => (
                                    <tr
                                        key={id}
                                        className="border-t border-gray-200"
                                    >
                                        <td className="px-4 py-2">
                                            {intent.amount}
                                        </td>
                                        <td className="px-4 py-2">
                                            {intent.token}
                                        </td>
                                        <td className="px-4 py-2">
                                            @{intent.recipient}
                                        </td>
                                        <td className="px-4 py-2">
                                            <span
                                                className={`px-2 py-1 rounded text-sm ${
                                                    intent.status === "pending"
                                                        ? "bg-yellow-200 text-yellow-800"
                                                        : "bg-green-200 text-green-800"
                                                }`}
                                            >
                                                {intent.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                            {new Date(
                                                intent.createdAt
                                            ).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() =>
                                                    handleCreateTx(id)
                                                }
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                            >
                                                Complete Tx
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
