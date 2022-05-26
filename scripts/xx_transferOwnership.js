/**
 * TODO: transfer ownership of contract from owner to multisig wallet
 */

const { ethers } = require('hardhat');
require('dotenv').config();
const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS, GNOSIS_ADDRESS } =
  process.env;

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
  const firstOwner = await kiftContract.owner();
  console.log(`First Owner: ${firstOwner}`);

  const tx = await kiftContract.transferOwnership(GNOSIS_ADDRESS);
  const receipt = await tx.wait();
  const { transactionHash } = receipt;
  console.log(`Ownership transfer complete. Hash: ${transactionHash}`);

  const secondOwner = await kiftContract.owner();
  console.log(`Second Owner: ${secondOwner}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });