import { ethers } from "hardhat";

async function main() {
  console.log("Deploying BLS Preconf contracts...");

  const diamond = await ethers.deployContract("Diamond");
  console.log("Diamond deployed to:", await diamond.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});