const { ethers } = require('hardhat');
require('dotenv').config();
const contract = require('../src/artifacts/contracts/Kiftables.sol/Kiftables.json');
const { testAddresses } = require('../config/config');
const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS, TEST_WALLET_OWNER } =
  process.env;
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

const NUM_TO_AIRDROP = 5;

function generateTokenIdArray(start) {
  return Array.from({ length: NUM_TO_AIRDROP }, (_, i) => i + start);
}

async function asyncForEach(array, callback) {
  const res = [];
  for (let index = 0; index < array.length; index++) {
    res.push(await callback(array[index], index, array));
  }
  return res;
}

async function main() {
  // airdrop mint is performed during deploy. just check balance

  let balance = await kiftContract.balanceOf(TEST_WALLET_OWNER);
  console.log('Balance of owner contract after airdrop: ', balance.toString());

  console.log('Addresses to send: ', testAddresses)

  await asyncForEach(testAddresses, async (address, idx) => {
    const tokenIds = generateTokenIdArray(idx * NUM_TO_AIRDROP + 1);      // tokenIds base 1, not 0
    console.log(`Transfering tokenIds ${tokenIds} to ${address}`);
    const tx = await kiftContract.airdropTransfer(address, tokenIds);
    const receipt = await tx.wait();
    const { transactionIndex, blockHash, transactionHash } = receipt;
    console.log(`Airdrop to ${address} complete: `, {
      transactionIndex,
      blockHash,
      transactionHash
    });
    const balance = await kiftContract.balanceOf(address);
    console.log(`Wallet ${address} balance after transfer: ${balance}`);
  })

}

main()
  .then(() => {process.exit(0)})
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
