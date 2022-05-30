const hre = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');
async function main() {
  const Kiftables = await hre.ethers.getContractFactory('Kiftables');
	
  const vrfCoordinator = '0x6168499c0cffcacd319c818142124b7a15e857ab';
  const s_keyHash = '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc';
  const subscriptionId = '4237';

  const kiftables = await Kiftables.deploy(
    BASE_PREREVEAL_URL,
    s_keyHash,
    vrfCoordinator,
    subscriptionId
  );

  await kiftables.deployed();

  console.log('Kiftables NFT Contract deployed to:', kiftables.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
