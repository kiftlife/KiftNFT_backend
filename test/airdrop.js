const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

const buf2hex = (x) => '0x' + x.toString('hex');

const claimAddresses = [
  '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
  '0x70997970c51812dc3a010c7d01b50e0d17dc79c8'
];



describe('Airdrop', function () {
  it('Should allow airdrop claim', async function () {
    const [owner, addr1] = await ethers.getSigners();
    const claimHash = claimAddresses.map((addr) => keccak256(addr));
    const claimTree = new MerkleTree(claimHash, keccak256, {
      sortPairs: true
    });
    const claimRoot = buf2hex(claimTree.getRoot());

    const kiftVans = await (
      await ethers.getContractFactory('KiftVans')
    ).deploy(1000, 10);
    await kiftVans.deployed();

    console.log('setting airdrop root: ', claimRoot);
    await kiftVans.connect(owner).setClaimListMerkleRoot(claimRoot);

    const proof = claimTree.getHexProof(claimHash[1]);

    console.log('proof: ', proof);

    const verified = await kiftVans.connect(addr1).verify(proof, claimRoot);
    console.log('Verified? ', verified);
    expect(verified).to.equal(true);

    const numToClaim = 5

    await kiftVans.connect(addr1).claim(numToClaim, proof);

    balance = await kiftVans.balanceOf(claimAddresses[1]);
    expect(balance).to.equal(numToClaim);
  });
});


