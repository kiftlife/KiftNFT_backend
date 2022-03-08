const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const buf2hex = (x) => '0x' + x.toString('hex');

const communityAddresses = [
    '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc',
    '0x90f79bf6eb2c4f870365e785982e1f101e93b906',
    '0x15d34aaf54267db7d7c367839aaf71a00a2c6a65'
  ];

describe('Community Sale', function () {
    it('Should allow whitelist mint', async function () {
      const [owner, addr1, addr2] = await ethers.getSigners();
  
      const communityHash = communityAddresses.map((addr) => keccak256(addr));
      const communityTree = new MerkleTree(communityHash, keccak256, {
        sortPairs: true
      });
      const communityRoot = buf2hex(communityTree.getRoot());
  
      const kiftVans = await (
        await ethers.getContractFactory('KiftVans')
      ).deploy(1000, 10);
      await kiftVans.deployed();
  
      console.log('setting community root: ', communityRoot);
      await kiftVans.setCommunityListMerkleRoot(communityRoot);
  
      const proof = communityTree.getHexProof(communityHash[0]);
      console.log('Community Proof: ', proof);
  
      const verified = await kiftVans.connect(addr2).verify(proof, communityRoot);
      console.log('Verified? ', verified);
      expect(verified).to.equal(true);
  
      await kiftVans.setIsCommunitySaleActive(true);
      await kiftVans.connect(addr2).mintCommunitySale(1, proof, {
        value: ethers.utils.parseEther('0.1')
      });
  
      balance = await kiftVans.balanceOf(communityAddresses[0]);
      expect(balance).to.equal(1);
    });
  });