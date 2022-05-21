const { ethers } = require('hardhat');
require('dotenv').config();
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const buf2hex = (x) => '0x' + x.toString('hex');
const serviceAccount = require('../config/kift-dao-firebase-adminsdk-h33ad-dc02a0ded4.json');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://kift-dao.firebaseio.com'
});

const getAddresses = async () => {
  const result = await admin
    .firestore()
    .doc('/ALLOWLIST/d8dhgQ0U1oq2pF9rRkRy')
    .get();
  const doc = result.data();
  const { ADDRESSES } = doc;

  return ADDRESSES;
};

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
  const addresses = await getAddresses();

  console.log('Addresses: ', addresses);
  const hashedAddresses = addresses.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(hashedAddresses, keccak256, {
    sortPairs: true
  });
  const rootHash = buf2hex(merkleTree.getRoot());
  console.log('Root Hash: ', rootHash);

  // const tx = await kiftContract.setCommunityListMerkleRoot(rootHash);
  // await tx.wait();

  // console.log('AllowList Set');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
