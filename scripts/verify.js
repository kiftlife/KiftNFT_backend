const hre = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');
const { CONTRACT_ADDRESS } = process.env;

const vrfCoordinator = '0x6168499c0cffcacd319c818142124b7a15e857ab';
const s_keyHash =
  '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc';
const subscriptionId = '4237';

const main = async () => {

   // npx hardhat verify --network rinkeby 0xB0aBD6C38E4d90899DA9e582B580d4028e9e51BB ipfs://QmYcdk2XeDwuD9UgVzviBtjR2Ru4TmnQR5zcrs2ftaEvpV 0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc 0x6168499c0cffcacd319c818142124b7a15e857ab 4237

  // TODO confirm this works
  await hre.run('verify:verify', {
    address: CONTRACT_ADDRESS,
    constructorArguments: [
      BASE_PREREVEAL_URL,
      s_keyHash,
      vrfCoordinator,
      subscriptionId
    ]
  });
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
