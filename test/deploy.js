const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployAllContracts, asyncForEach, generateTokenIdArray } = require('./utilities');

describe('Deploy Kiftables', function () {
  it('Owner should mint treasury tokens', async function () {
    const [owner] = await ethers.getSigners();

    const kiftables = await deployAllContracts();
    await kiftables.deployed();
    await kiftables.connect(owner).treasuryMint();

    const maxTreasuryVans = 1000;

    let ownerBalance = await kiftables.balanceOf(owner.address);
    console.log('Owner balance: ', ownerBalance);
    expect(ownerBalance).to.equal(maxTreasuryVans);
  });

  it('Owner should Airdrop to Contributors', async () => {
    const [owner, signer1, signer2] = await ethers.getSigners();

    const kiftables = await deployAllContracts();
    await kiftables.deployed();
    await kiftables.connect(owner).treasuryMint();

    await asyncForEach([signer1, signer2], async (signer, idx) => {
      const { address } = signer;
      const tokenIds = generateTokenIdArray(idx * 5 + 1, 5);
      console.log(`Sending tokens ${tokenIds} to ${address}`);
      await kiftables.connect(owner).bulkTransfer(address, tokenIds);
      const balance = await kiftables.balanceOf(address);
      expect(balance).to.equal(5);
    });
  });
});
