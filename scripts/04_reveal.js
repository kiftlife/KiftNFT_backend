const { ethers } = require('hardhat');
require('dotenv').config();
const contract = require('../src/artifacts/contracts/KiftVans.sol/KiftVans.json');
const { BASE_PREREVEAL_URL , IPFS_BASE_URL} = require('../config/config');
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

async function main() {
    const preRevealUrl = await kiftContract.tokenURI(1);
    console.log('Pre-reveal URL: ', preRevealUrl);
    
    const tx = await kiftContract.toggleReveal(true);
    const receipt = await tx.wait();
    const { transactionIndex, blockHash, transactionHash } = receipt;
    console.log(`REVEAL THE METADATA complete: `, {
      transactionIndex,
      blockHash,
      transactionHash
    });

    revealed = await kiftContract.revealed();
    
    console.log('Revealed? ', revealed)

    const revealedUrl = await kiftContract.tokenURI(1);
    console.log('Revealed URL: ', revealedUrl);
}

main().then(() => process.exit(0)).catch((error) => {
    console.error(error)
    process.exit(1)
})