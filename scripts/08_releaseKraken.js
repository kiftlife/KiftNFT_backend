/**
 * TODO: release kraken
 */

 const { ethers } = require('hardhat');
 require('dotenv').config();
 
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
   await kiftContract.reveal();
 }
 
 main()
   .then(() => {})
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
 