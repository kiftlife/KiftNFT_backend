const { ethers } = require('hardhat');

async function main() {
  const KiftVans = await ethers.getContractFactory('KiftVans');
  const kiftVans = await KiftVans.deploy();

  await kiftVans.deployed();

  console.log('KiftVans NFT Contract deployed to:', kiftVans.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
