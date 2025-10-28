const { ethers } = require("hardhat");

async function main() {
  // USDC and USDT addresses on Polygon
  const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"; // Mainnet
  const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F"; // Mainnet
  
  // For Mumbai testnet:
  // const USDC_ADDRESS = "0x0FA8781a83E46826621b3DC094cDbC922b47fA6";
  // const USDT_ADDRESS = "0xBD21A10F619BE90d6066C941b04e340841F1F989";

  console.log("Deploying OpinionMarket contract...");

  const OpinionMarket = await ethers.getContractFactory("OpinionMarket");
  const opinionMarket = await OpinionMarket.deploy(USDC_ADDRESS, USDT_ADDRESS);

  await opinionMarket.deployed();

  console.log("OpinionMarket deployed to:", opinionMarket.address);
  console.log("USDC Address:", USDC_ADDRESS);
  console.log("USDT Address:", USDT_ADDRESS);
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    address: opinionMarket.address,
    usdcAddress: USDC_ADDRESS,
    usdtAddress: USDT_ADDRESS,
    network: "polygon"
  };
  
  fs.writeFileSync(
    './frontend/contracts/deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to ./frontend/contracts/deployment.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

