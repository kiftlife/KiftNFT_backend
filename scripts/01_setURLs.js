const { ethers } = require('hardhat');
require('dotenv').config();
const { IPFS_BASE_URL, BASE_PREREVEAL_URL } = require('../config/config');
const { ALCHEMY_API_KEY, DEV_PRIVATE_KEY, TEST_CONTRACT_ADDRESS } = process.env;

const contract = require('../src/artifacts/contracts/Kiftables.sol/Kiftables.json');
const alchemyProvider = new ethers.providers.AlchemyProvider(
  (network = 'rinkeby'),
  ALCHEMY_API_KEY
);

const signer = new ethers.Wallet(DEV_PRIVATE_KEY, alchemyProvider);
const kiftContract = new ethers.Contract(
  TEST_CONTRACT_ADDRESS,
  contract.abi,
  signer
);

async function main() {

  const tx0 = await kiftContract.setPreRevealURI(BASE_PREREVEAL_URL);
  const receipt0 = await tx0.wait();
  console.log(`Update preveal url: `, await kiftContract.preRevealBaseURI());
  
  const tx1 = await kiftContract.setBaseURI(IPFS_BASE_URL);
  const receipt1 = await tx1.wait();
  const { transactionIndex, blockHash, transactionHash } = receipt1;
  console.log('Set base url complete: ', {
    transactionIndex,
    blockHash,
    transactionHash
  });
  const result = await kiftContract.baseURI();
  console.log('Base url set to: ', result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
