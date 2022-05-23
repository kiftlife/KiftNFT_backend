const { ethers } = require('hardhat');
require('dotenv').config();
const contract = require('../src/artifacts/contracts/Kiftables.sol/Kiftables.json');
const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;
const alchemyProvider = new ethers.providers.AlchemyProvider(
  (network = 'rinkeby'),
  ALCHEMY_API_KEY
);
const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);
const kiftContract = new ethers.Contract(
  CONTRACT_ADDRESS,
  contract.abi,
  signer
);

async function main() {
  let revealCount = await kiftContract.revealCount();
  console.log(`Reveal Count: ${revealCount}`);

  const tx = await kiftContract.revealNextBatch();
  const receipt = await tx.wait();
  const { transactionIndex, blockHash, transactionHash } = receipt;
  console.log(`REVEAL BATCH COMPLETE: `, {
    transactionIndex,
    blockHash,
    transactionHash
  });

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
