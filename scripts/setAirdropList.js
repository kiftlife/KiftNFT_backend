const { ethers } = require('hardhat');

async function main() {
  const Kiftables = await ethers.getContractFactory('Kiftables');
  const kiftables = await Kiftables.deploy();

  await kiftables.deployed();

  console.log('Kiftables NFT Contract deployed to:', kiftables.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
