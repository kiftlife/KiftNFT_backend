const hre = require('hardhat');
async function main() {
  const Kiftables = await hre.ethers.getContractFactory('Kiftables');
	
  // rinkeby
  const { BASE_PREREVEAL_URL, RINKEBY_OPENSEA_PROXY } = require('../config/config');
  const vrfCoordinator = '0x6168499c0cffcacd319c818142124b7a15e857ab';
  const s_keyHash = '0xd89b2bf150e3b9e13446986e571fb9cab24b13cea0a43ea20a6049a85cc807cc';
  const subscriptionId = '4237';
  const gnosisSafe = '0xc3E162Ccc8f1Db6Cae1A201A65036F88D13aA22a';
  
  // const { PROD_PREREVEAL_URL } = require('../config/config');
  // const vrfCoordinator = '0x271682DEB8C4E0901D1a1550aD2e64D568E69909';
  // const s_keyHash = '0xff8dedfbfa60af186cf3c830acbc32c05aae823045ae5ea7da1e45fbfaba4f92';
  // const subscriptionId = '138';
  // const gnosisSafe = '0x13709E1c65812050BBae94D8A8Afe024cae66916';   
  // const MAINNET_OPENSEA_PROXY = '0xa5409ec958c83c3f309868babaca7c86dcb077c1';

  const kiftables = await Kiftables.deploy(
    BASE_PREREVEAL_URL,
    s_keyHash,
    vrfCoordinator,
    subscriptionId,
    RINKEBY_OPENSEA_PROXY,
    gnosisSafe
  );

  await kiftables.deployed();

  console.log('Kiftables Contract deployed to:', kiftables.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
