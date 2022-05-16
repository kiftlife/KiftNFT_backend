const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const buf2hex = (x) => '0x' + x.toString('hex');

describe('Community Sale', function () {
    it('Should allow whitelist mint', async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
  
      const communityHash = communityDevAddresses.map((addr) => keccak256(addr));
      const communityTree = new MerkleTree(communityHash, keccak256, {
        sortPairs: true
      });
      const communityRoot = buf2hex(communityTree.getRoot());
  
      const kiftables = await (
        await ethers.getContractFactory('Kiftables')
      ).deploy(1000, 10);
      await kiftables.deployed();
  
      console.log('setting community root: ', communityRoot);
      await kiftables.setCommunityListMerkleRoot(communityRoot);
  
      const proof = communityTree.getHexProof(communityHash[0]);
      console.log('Community Proof: ', proof);
  
      const verified = await kiftables.connect(addr2).verify(proof, communityRoot);
      console.log('Verified? ', verified);
      expect(verified).to.equal(true);
  
      await kiftables.setIsCommunitySaleActive(true);
      await kiftables.connect(addr2).mintCommunitySale(1, proof, {
        value: ethers.utils.parseEther('0.1')
      });
  
      balance = await kiftables.balanceOf(communityDevAddresses[0]);
      expect(balance).to.equal(1);
    });
  });