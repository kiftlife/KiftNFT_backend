const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL, IPFS_BASE_URL } = require('../config/config');
const {
  deployAllContracts,
  asyncForEach,
  generateTokenIdArray
} = require('./utilities');

const TOKEN_LIMIT = 10000;
const BATCH_SIZE = 200;

describe('BatchReveal', async () => {
  it('Successfully batch reveal 10000 tokens', async () => {
    // setup
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    // deploy
    const kiftables = await deployAllContracts();

    // treasury mint.
    await kiftables.connect(owner).treasuryMint();
    // TokenIds 0 - 999 are now minted to owner

    console.log('************* MINT 1001 *************');
    // 1000 tokens minted in constructor. Mint another 1001 so we're at 2000
    // 1 batch of 1000 minted tokens [0 - 999]
    // 1 over into second, un-revealed batch [1000 - 1999]
    let mintCount = 1001;
    let amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.setIsPublicSaleActive(true);
    await kiftables.setBaseURI(IPFS_BASE_URL);
    await kiftables.connect(addr1).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    // TODO mint all the way up to 10000 and confirm not overflows/offset issues
    console.log('************* MINT REMAINING TOKENS (10000) *************');

    mintCount = TOKEN_LIMIT - (await kiftables.count());
    console.log('Remaining Tokens to mint: ', mintCount);
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.connect(addr3).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    const totalMinted = parseInt(await kiftables.count());
    console.log('Total Minted thus far: ', totalMinted);
    expect(totalMinted).to.equal(10000);

    const remainingBatches = generateTokenIdArray(0, TOKEN_LIMIT / BATCH_SIZE);
    await asyncForEach(remainingBatches, async (batch) => {
      await kiftables.revealNextBatch();
      let seed = await kiftables.getSeedForBatch(batch);
    });

    lastTokenRevealed = await kiftables.revealCount();
    console.log('Revealed up until: ', lastTokenRevealed);

    console.warn(
      '!!!!!!!!!!!! CAREFUL, running this can take 10+ minutes !!!!!!!!!!!!'
    );
    const shuffledIds = [];
    // Note: To run the full test, change 100 to 10000  => this can take 60+ minutes
    const tokens = generateTokenIdArray(0, 100);
    await asyncForEach(tokens, async (id) => {
      const shuffledId = await kiftables.getShuffledTokenId(id);
      console.log(`Mapped token ${id} to ${shuffledId}`);
      shuffledIds.push(shuffledId);
    });

    console.log('Shuffled count: ', shuffledIds.length);
    const uniqueSet = [...new Set(shuffledIds)];
    console.log('Unique count: ', uniqueSet.length);
  });
});
