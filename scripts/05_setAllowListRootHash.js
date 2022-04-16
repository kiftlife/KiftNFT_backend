const { ethers } = require('hardhat');
require('dotenv').config();
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const buf2hex = (x) => '0x' + x.toString('hex');

const addresses = [
    '0x3F297A7f5631EEeF286c2a636c92c26789e5DE4D',
    '0xbcd4042de499d14e55001ccbb24a551f3b954097',
    '0xbcd4042de499d14e55001ccbb24a551f3b954096',
    '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
    '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
    '0x93E40A70115C9EfC67f817BfC62717d8Ab66C720'

]
const hashedAddresses = addresses.map((addr) => keccak256(addr));
const merkleTree = new MerkleTree(hashedAddresses, keccak256, {
  sortPairs: true
});
const rootHash = buf2hex(merkleTree.getRoot());
console.log('Root Hash: ', rootHash)

const { ALCHEMY_API_KEY, PRIVATE_KEY, CONTRACT_ADDRESS } = process.env;

const contract = require('../src/artifacts/contracts/KiftVans.sol/KiftVans.json');
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
  const tx = await kiftContract.setCommunityListMerkleRoot(rootHash);
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
