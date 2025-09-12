const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("🚀 Starting contract deployment...");

  // Get deployer and fee collector signers
  const [deployer, feeCollector] = await ethers.getSigners();

  // Get addresses
  const deployerAddress = await deployer.getAddress();
  const feeCollectorAddress = await feeCollector.getAddress();

  // Get deployer balance
  const balance = await deployer.provider.getBalance(deployerAddress);
  console.log("📝 Deploying contracts with account:", deployerAddress);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");

  // -------------------------------
  // Deploy TestToken
  // -------------------------------
  console.log("\n🪙 Deploying TestToken...");
  const TestToken = await ethers.getContractFactory("TestToken");
  const initialSupply = ethers.parseUnits("1000000", 18); // 1 million tokens
  const testToken = await TestToken.deploy(initialSupply);
  await testToken.waitForDeployment();
  const testTokenAddress = await testToken.getAddress();
  console.log("✅ TestToken deployed to:", testTokenAddress);

  // -------------------------------
  // Deploy RemittanceRouter
  // -------------------------------
  console.log("\n🔄 Deploying RemittanceRouter...");
  const RemittanceRouter = await ethers.getContractFactory("RemittanceRouter");
  const feeBps = 100; // 1% fee
  const remittanceRouter = await RemittanceRouter.deploy(feeCollectorAddress, feeBps);
  await remittanceRouter.waitForDeployment();
  const routerAddress = await remittanceRouter.getAddress();
  console.log("✅ RemittanceRouter deployed to:", routerAddress);

  // -------------------------------
  // Configure allowed token
  // -------------------------------
  console.log("\n⚙️ Configuring RemittanceRouter...");
  await remittanceRouter.setAllowedToken(testTokenAddress, true);
  console.log("✅ TestToken added to allowed tokens");

  // -------------------------------
  // Transfer some tokens to deployer for testing
  // -------------------------------
  const transferAmount = ethers.parseUnits("10000", 18); // 10k tokens
  await testToken.transfer(deployerAddress, transferAmount);
  console.log("💸 Transferred", ethers.formatUnits(transferAmount, 18), "test tokens to deployer");

  // -------------------------------
  // Save deployment info
  // -------------------------------
  const network = await deployer.provider.getNetwork();
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    testToken: testTokenAddress,
    remittanceRouter: routerAddress,
    owner: deployerAddress,
    feeCollector: feeCollectorAddress,
    feeBps: feeBps,
    deploymentTime: new Date().toISOString()
  };
  fs.writeFileSync('./deployment-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log("💾 Deployment info saved to deployment-info.json");

  // -------------------------------
  // Deployment summary
  // -------------------------------
  console.log("\n🎉 Deployment Summary:");
  console.log("==========================================");
  console.log("📋 Network:", network.name);
  console.log("🪙 TestToken Address:", testTokenAddress);
  console.log("🔄 RemittanceRouter Address:", routerAddress);
  console.log("👤 Owner:", deployerAddress);
  console.log("💰 Fee Collector:", feeCollectorAddress);
  console.log("📊 Fee Rate:", feeBps, "basis points (", feeBps / 100, "%)");
  console.log("==========================================");
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
