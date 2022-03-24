const { ethers } = require('hardhat');
require('dotenv').config();
const contract = require('../src/artifacts/contracts/KiftVans.sol/KiftVans.json');
const { airdropTestAddresses } = require('../config/config');
const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS, TEST_WALLET_OWNER } =
  process.env;
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

function generateTokenIdArray(start) {
  return Array.from({ length: 10 }, (_, i) => i + start);
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

  console.log('Addresses to send: ', airdropTestAddresses)

  await asyncForEach(airdropTestAddresses, async (address, idx) => {
    const tokenIds = generateTokenIdArray(idx * 10 + 1);
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
