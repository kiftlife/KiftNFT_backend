const { expect } = require('chai');
const { ethers } = require('hardhat');
const {
  deployAllContracts,
  asyncForEach,
  generateTokenIdArray
} = require('./utilities');

const CONTRIBUTOR_AIRDROP_COUNT = 5;

describe('Deploy Kiftables', function () {
  it('Owner should Airdrop to Contributors', async () => {
    const [owner, signer1, signer2, signer3, signer4, signer5] =
      await ethers.getSigners();

    const kiftables = await deployAllContracts();
    await kiftables.deployed();
    await kiftables.connect(owner).treasuryMint();

    await asyncForEach(
      [signer1, signer2, signer3, signer4, signer5],
      async (signer, idx) => {
        const { address } = signer;
        const tokenIds = generateTokenIdArray(
          idx * 5 + 1,
          CONTRIBUTOR_AIRDROP_COUNT
        ); // [1,2,3,4,5], [6,7,8,9,10] etc
        console.log(`Sending tokens ${tokenIds} to ${address}`);
        await kiftables.connect(owner).airdrop(address, tokenIds);
        const balance = await kiftables.balanceOf(address);
        expect(balance).to.equal(CONTRIBUTOR_AIRDROP_COUNT);
      }
    );
  });
});
