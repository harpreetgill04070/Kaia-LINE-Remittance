const { ethers } = require("ethers");

// Contract ABIs (simplified versions)
const REMITTANCE_ROUTER_ABI = [
    "function remit(address token, address to, uint256 amount, string calldata memo) external",
    "function isTokenAllowed(address token) external view returns (bool)",
    "function feeBps() external view returns (uint16)",
    "event Remitted(address indexed token, address indexed from, address indexed to, uint256 amount, uint256 fee, string memo)",
];

const ERC20_ABI = [
    "function balanceOf(address account) external view returns (uint256)",
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function decimals() external view returns (uint8)",
    "function symbol() external view returns (string)",
];

class ContractIntegration {
    constructor() {
        this.provider = null;
        this.remittanceRouter = null;
        this.tokenContracts = {};
        this.initializeContracts();
    }

    initializeContracts() {
        try {
            // Initialize provider (for local hardhat network)
            this.provider = new ethers.JsonRpcProvider(
                process.env.SEPOLIA_RPC_URL || "http://localhost:8545"
            );

            // Initialize RemittanceRouter contract
            const routerAddress = process.env.REMITTER_ROUTER_ADDRESS;
            if (routerAddress) {
                this.remittanceRouter = new ethers.Contract(
                    routerAddress,
                    REMITTANCE_ROUTER_ABI,
                    this.provider
                );
                console.log(
                    "✅ RemittanceRouter contract initialized:",
                    routerAddress
                );
            }

            // Initialize token contracts
            this.initializeTokenContracts();
        } catch (error) {
            console.error("❌ Failed to initialize contracts:", error.message);
        }
    }

    initializeTokenContracts() {
        const tokenAddresses = {
            USDT: process.env.USDT_CONTRACT_ADDRESS,
            USDC: process.env.USDC_CONTRACT_ADDRESS,
            TT: process.env.TEST_TOKEN_ADDRESS, // TestToken
        };

        for (const [symbol, address] of Object.entries(tokenAddresses)) {
            if (address) {
                this.tokenContracts[symbol] = new ethers.Contract(
                    address,
                    ERC20_ABI,
                    this.provider
                );
                console.log(`✅ ${symbol} contract initialized:`, address);
            }
        }
    }

    async getTokenBalance(userAddress, tokenSymbol) {
        try {
            const tokenContract = this.tokenContracts[tokenSymbol];
            if (!tokenContract) {
                throw new Error(`Token ${tokenSymbol} not configured`);
            }

            const balance = await tokenContract.balanceOf(userAddress);
            const decimals = await tokenContract.decimals();
            return ethers.formatUnits(balance, decimals);
        } catch (error) {
            console.error(
                `❌ Failed to get ${tokenSymbol} balance:`,
                error.message
            );
            return "0";
        }
    }

    async getTokenSymbol(tokenAddress) {
        try {
            const tokenContract = new ethers.Contract(
                tokenAddress,
                ERC20_ABI,
                this.provider
            );
            return await tokenContract.symbol();
        } catch (error) {
            console.error("❌ Failed to get token symbol:", error.message);
            return "UNKNOWN";
        }
    }

    async isTokenAllowed(tokenAddress) {
        try {
            if (!this.remittanceRouter) {
                throw new Error("RemittanceRouter not initialized");
            }
            return await this.remittanceRouter.isTokenAllowed(tokenAddress);
        } catch (error) {
            console.error("❌ Failed to check token allowance:", error.message);
            return false;
        }
    }

    async getFeeRate() {
        try {
            if (!this.remittanceRouter) {
                throw new Error("RemittanceRouter not initialized");
            }
            const feeBps = await this.remittanceRouter.feeBps();
            return Number(feeBps) / 100; // Convert basis points to percentage
        } catch (error) {
            console.error("❌ Failed to get fee rate:", error.message);
            return 0;
        }
    }

    async createRemittanceTransaction(intent, userAddress) {
        try {
            const { amount, token, recipient } = intent;

            // Get token contract
            const tokenContract = this.tokenContracts[token];
            if (!tokenContract) {
                throw new Error(`Token ${token} not supported`);
            }

            // Check if token is allowed
            const tokenAddress = await tokenContract.getAddress();
            const isAllowed = await this.isTokenAllowed(tokenAddress);
            if (!isAllowed) {
                throw new Error(
                    `Token ${token} is not allowed for remittances`
                );
            }

            // Check user balance
            const balance = await this.getTokenBalance(userAddress, token);
            const requiredAmount = parseFloat(amount);
            if (parseFloat(balance) < requiredAmount) {
                throw new Error(
                    `Insufficient ${token} balance. Required: ${amount}, Available: ${balance}`
                );
            }

            // Get fee rate
            const feeRate = await this.getFeeRate();
            const feeAmount = requiredAmount * (feeRate / 100);
            const netAmount = requiredAmount - feeAmount;

            return {
                success: true,
                tokenAddress,
                amount: ethers.parseUnits(amount, 18),
                feeAmount,
                netAmount,
                feeRate,
                memo: `Remittance to @${recipient}`,
                contractAddress: process.env.REMITTER_ROUTER_ADDRESS,
            };
        } catch (error) {
            console.error(
                "❌ Failed to create remittance transaction:",
                error.message
            );
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async getContractInfo() {
        try {
            const feeRate = await this.getFeeRate();
            const network = await this.provider.getNetwork();

            return {
                remittanceRouter: process.env.REMITTER_ROUTER_ADDRESS,
                network: network.name,
                chainId: network.chainId.toString(),
                feeRate: `${feeRate}%`,
                supportedTokens: Object.keys(this.tokenContracts),
                isConnected: true,
            };
        } catch (error) {
            console.error("❌ Failed to get contract info:", error.message);
            return {
                isConnected: false,
                error: error.message,
            };
        }
    }
}

// Export singleton instance
module.exports = new ContractIntegration();
