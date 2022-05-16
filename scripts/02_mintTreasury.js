const { ethers } = require('hardhat');
require('dotenv').config();

const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

const contract = require('../src/artifacts/contracts/Kiftables.sol/Kiftables.json');
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
  const tx1 = await kiftContract.treasuryMint();
  await tx1.wait();

  console.log(
    'Treasury minted: ',
    await kiftContract.balanceOf(signer.address)
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });