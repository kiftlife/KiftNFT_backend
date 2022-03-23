const { ethers } = require('hardhat');
require('dotenv').config();
const { IPFS_BASE_URL } = require('../config/config');
const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

const contract = require('../src/artifacts/contracts/KiftVans.sol/KiftVans.json');
const alchemyProvider = new ethers.providers.AlchemyProvider(
  (network = 'maticmum'),
  ALCHEMY_API_KEY
);

const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);
const kiftContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contract.abi,
  signer
);

async function main() {
  const tx1 = await kiftContract.setBaseURI(IPFS_BASE_URL);
  const receipt1 = await tx1.wait();
  const { transactionIndex, blockHash, transactionHash } = receipt1;
  console.log('Set base url complete: ', {
    transactionIndex,
    blockHash,
    transactionHash
  });
  const result = await kiftContract.getBaseURI();
  console.log('Base url set to: ', result);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
