"use client";

import { useEffect, useState } from "react";

interface ContractInfo {
    address: string;
    owner: string;
    network: string;
    balance: string;
    symbol?: string;
    name?: string;
}

export default function ContractInfoPage() {
    const [info, setInfo] = useState<ContractInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await fetch("http://localhost:3001/contract-info", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                if (!res.ok) throw new Error("Failed to fetch contract info");
                const data = await res.json();
                setInfo(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchInfo();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-100 via-white to-gray-200">
            <h1 className="text-3xl font-bold mb-6">Contract Information</h1>

            {loading ? (
                <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            ) : info ? (
                <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-4 border border-gray-200">
                    <div>
                        <h2 className="text-lg font-semibold">
                            Contract Address
                        </h2>
                        <p className="text-sm break-all text-gray-600">
                            {info.address}
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">Owner</h2>
                        <p className="text-sm break-all text-gray-600">
                            {info.owner}
                        </p>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold">Network</h2>
                        <p className="text-sm text-gray-600">{info.network}</p>
                    </div>

                    {info.name && (
                        <div>
                            <h2 className="text-lg font-semibold">
                                Token Name
                            </h2>
                            <p className="text-sm text-gray-600">{info.name}</p>
                        </div>
                    )}

                    {info.symbol && (
                        <div>
                            <h2 className="text-lg font-semibold">Symbol</h2>
                            <p className="text-sm text-gray-600">
                                {info.symbol}
                            </p>
                        </div>
                    )}

                    <div>
                        <h2 className="text-lg font-semibold">Balance</h2>
                        <p className="text-sm text-gray-600">{info.balance}</p>
                    </div>

                    <button
                        onClick={() =>
                            navigator.clipboard.writeText(info.address)
                        }
                        className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                    >
                        Copy Contract Address
                    </button>
                </div>
            ) : (
                <p className="text-gray-500">No contract info available.</p>
            )}
        </div>
    );
}
