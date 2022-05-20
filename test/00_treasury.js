const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  deployAllContracts,
  asyncForEach,
  generateTokenIdArray
} = require('./utilities');

describe('Mint Treasury', function () {
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
});
