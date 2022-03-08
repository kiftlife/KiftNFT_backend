/**
 * run this with npx hardhat run merkle.js
 */

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const hre = require('hardhat');

const addresses = [
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8',
  '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
  '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
  '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65',
  '0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc',
  '0x976ea74026e726554db657fa54763abd0c3a0aa9',
  '0x14dc79964da2c08b23698b3d3cc7ca32193d9955',
  '0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f',
  '0xa0ee7a142d267c1f36714e4a8f75612f20a79720',
  '0xbcd4042de499d14e55001ccbb24a551f3b954096',
  '0xbcd4042de499d14e55001ccbb24a551f3b954097'
];
const buf2hex = (x) => '0x' + x.toString('hex');
const hashedAddresses = addresses.map((addr) => keccak256(addr));
const merkleTree = new MerkleTree(hashedAddresses, keccak256, {
  sortPairs: true
});
const rootHash = buf2hex(merkleTree.getRoot());

// console.log('Root Hash: ', rootHash);
// console.log('Merkle tree:  ', merkleTree.toString());

const proof = merkleTree.getHexProof(hashedAddresses[0]);

console.log(merkleTree.verify(proof, hashedAddresses[0], rootHash))

async function main() {


  // We get the contract to deploy
  const KiftVans = await hre.ethers.getContractFactory("KiftVans");
  const kiftVans = await KiftVans.deploy(1000, 10);

  await kiftVans.deployed();

  await kiftVans.setClaimListMerkleRoot(rootHash);
  const proof = merkleTree.getHexProof(hashedAddresses[0]);
  const verified = await kiftVans.verify(proof, rootHash);
  console.log('Verified: ', verified)

  const tx = await kiftVans.claim(proof)
  const receipt = await tx.wait();

  console.log(receipt);

  console.log("KiftVans NFT deployed to:", kiftVans.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });