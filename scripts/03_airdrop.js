const { ethers } = require('hardhat');
require('dotenv').config();

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
  const tx1 = await kiftContract.airdropMint();
  const receipt1 = tx1.await();
  const { transactionIndex, blockHash, transactionHash } = receipt1;
  console.log('Airdrop complete: ', {
    transactionIndex,
    blockHash,
    transactionHash
  });

  let balance = await kiftVans.balanceOf(owner.address);
  console.log('Balance of owner contract after airdrop: ', balance);
}

main()
  .then(() => {})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
