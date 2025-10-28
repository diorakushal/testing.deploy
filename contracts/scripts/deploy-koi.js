const { ethers } = require("hardhat");

async function main() {
  // USDC and USDT addresses on Polygon
  const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Polygon Mainnet
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // Polygon Mainnet
  
  // For Mumbai testnet (uncomment for testnet):
  // const USDC_ADDRESS = "0x0FA8781a83E46826621b3DC094cDbC922b47fA6";
  // const USDT_ADDRESS = "0xBD21A10F619BE90d6066C941b04e340841F1F989";

  console.log("Deploying KOI contract...");

  const KOI = await ethers.getContractFactory("KOI");
  const koi = await KOI.deploy([USDC_ADDRESS, USDT_ADDRESS]);

  await koi.deployed();

  console.log("KOI deployed to:", koi.address);
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("USDT Address:", USDT_ADDRESS);
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    address: koi.address,
    usdcAddress: USDC_ADDRESS,
    usdtAddress: USDT_ADDRESS,
    network: "polygon",
    deployer: await ethers.provider.getSigner().getAddress()
  };
  
  fs.writeFileSync(
    './frontend/contracts/deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\nDeployment info saved to ./frontend/contracts/deployment.json");
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with MARKET_CONTRACT_ADDRESS=" + koi.address);
  console.log("2. Update frontend/.env.local with NEXT_PUBLIC_CONTRACT_ADDRESS=" + koi.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

