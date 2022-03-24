const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');
async function main() {
  const KiftVans = await ethers.getContractFactory('KiftVans');
  const kiftVans = await KiftVans.deploy(BASE_PREREVEAL_URL);

  await kiftVans.deployed();

  console.log('KiftVans NFT Contract deployed to:', kiftVans.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
