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
  const tx = await kiftContract.setIsCommunitySaleActive(false);

  await tx.wait();

  console.log(
    'Community sale active: ',
    await kiftContract.communitySaleLive()
  );
  console.log('Public sale active: ', await kiftContract.publicSaleLive());

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
