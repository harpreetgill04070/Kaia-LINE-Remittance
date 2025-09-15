"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";
// import taskStorageJson from "./TaskStorage.json";
import { useWallet } from "./WalletContext";

const ContractContext = createContext(null);

export const ContractProvider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [taskStorageContract, setTaskStorageContract] = useState(null);
    const { account } = useWallet();

    // contract address here
    // const contractAddress = "";

    useEffect(() => {
        const init = async () => {
            if (window.ethereum && account) {
                try {
                    const provider = new ethers.BrowserProvider(
                        window.ethereum
                    );
                    const signer = await provider.getSigner(); // Fixed: removed account parameter
                    // const contract = new ethers.Contract(
                    //     contractAddress,
                    //     taskStorageJson.abi,
                    //     signer
                    // );

                    setProvider(provider);
                    setSigner(signer);
                    // setTaskStorageContract(contract);
                } catch (error) {
                    console.error("Error initializing contract:", error);
                    setProvider(null);
                    setSigner(null);
                    setTaskStorageContract(null);
                }
            } else {
                // Reset when no account or ethereum
                setProvider(null);
                setSigner(null);
                setTaskStorageContract(null);
            }
        };

        init();
    }, [account]); // Added account as dependency

    return (
        <ContractContext.Provider
            value={{ provider, signer, taskStorageContract }}
        >
            {children}
        </ContractContext.Provider>
    );
};

export const useContract = () => useContext(ContractContext);
