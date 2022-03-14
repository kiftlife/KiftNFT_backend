const { ethers } = require('hardhat');
require('dotenv').config();

const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;
const IPFS_BASE_URL = 'https://gateway.pinata.cloud/ipfs/QmNbpCqZhXVLhddRSapVtST5jkvxo2VAJ4WtT5U7PyR8pt'
const contract = require('../src/artifacts/contracts/KiftVans.sol/KiftVans.json');
const alchemyProvider = new ethers.providers.AlchemyProvider(
    (network = 'maticmum'),
    ALCHEMY_API_KEY
  );
const signer = new ethers.Wallet(PRIVATE_KEY, alchemyProvider);
const kiftContract = new ethers.Contract(CONTRACT_ADDRESS, contract.abi, signer);

async function main() {

  console.log('Max vans per wallet: ' + await kiftContract.MAX_VANS_PER_WALLET());

  await kiftContract.connect(signer).setBaseURI(IPFS_BASE_URL)
  console.log('Base uri: ', await kiftContract.getBaseURI())
  
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
