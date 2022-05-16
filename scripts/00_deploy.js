const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');
async function main() {
  const Kiftables = await ethers.getContractFactory('Kiftables');
  const kiftables = await Kiftables.deploy(BASE_PREREVEAL_URL);

  await kiftables.deployed();

  console.log('Kiftables NFT Contract deployed to:', kiftables.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
