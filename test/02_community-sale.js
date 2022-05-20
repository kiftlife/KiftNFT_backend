const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { communityDevAddresses } = require('../config/config');
const {
  deployAllContracts,
  asyncForEach,
  generateTokenIdArray
} = require('./utilities');

const buf2hex = (x) => '0x' + x.toString('hex');

describe('Community Sale', function () {
  it('Should allow whitelist mint', async function () {
    const [owner, signer1, signer2, signer3] = await ethers.getSigners();
    const kiftables = await deployAllContracts();
    await kiftables.connect(owner).treasuryMint();

    const communityHash = [signer1, signer2, signer3].map((signer) =>
      keccak256(signer.address)
    );
    console.log(`Community Hash: ${buf2hex(communityHash[0])}`);
    const communityTree = new MerkleTree(communityHash, keccak256, {
      sortPairs: true
    });

    const communityRoot = buf2hex(communityTree.getRoot());
    console.log('setting community root: ', communityRoot);
    await kiftables.connect(owner).setCommunityListMerkleRoot(communityRoot);

    const proof = communityTree.getHexProof(communityHash[0]);
    console.log('Community Proof: ', proof);

    const verified = await kiftables
      .connect(signer1)
      .verify(proof, communityRoot);
    console.log('Verified? ', verified);
    expect(verified).to.equal(true);

    await kiftables.connect(owner).setIsCommunitySaleActive(true);
    await kiftables.connect(signer1).mintCommunitySale(1, proof, {
      value: ethers.utils.parseEther('0.08')
    });

    balance = await kiftables.balanceOf(signer1.address);
    expect(balance).to.equal(1);
  });
});
