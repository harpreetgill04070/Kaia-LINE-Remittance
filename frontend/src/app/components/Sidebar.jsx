"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const sidebarItems = [
    "Home",
    "Transactions",
    "Intents",
    "Send Funds",
    "Balances",
    "Contract Info",
];
const sidebarLinks = [
    "/",
    "/transactions",
    "/intents",
    "/send-funds",
    "/balances",
    "/contract-info",
]; // use absolute paths

const Sidebar = ({ isOpen, onClose }) => {
    return (
        <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: isOpen ? "0%" : "-100%" }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 h-full w-64 bg-white shadow-md z-50 flex flex-col"
        >
            <div className="p-4 border-b text-xl font-semibold text-gray-800">
                ☀️ Sidebar
            </div>
            <ul className="flex flex-col gap-2 p-4 text-gray-700">
                {sidebarItems.map((item, index) => (
                    <li key={item}>
                        <Link
                            href={sidebarLinks[index]}
                            className="block px-4 py-2 rounded-md hover:bg-gray-100"
                            onClick={onClose}
                        >
                            {item}
                        </Link>
                    </li>
                ))}
            </ul>
        </motion.div>
    );
};

export default Sidebar;
