/**
 * TODO: release kraken
 */

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
   await kiftContract.reveal();
 }
 
 main()
   .then(() => {})
   .catch((error) => {
     console.error(error);
     process.exit(1);
   });
 