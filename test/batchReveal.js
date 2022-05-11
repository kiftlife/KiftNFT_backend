const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL, IPFS_BASE_URL } = require('../config/config');
const {
  deployAllContracts,
  asyncForEach,
  generateTokenIdArray
} = require('./utilities');

describe('BatchReveal', async () => {
  it('Successfully batch reveal 10000 tokens', async () => {
    // setup
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    // deploy
    const kiftables = await deployAllContracts();

    // treasury mint.
    await kiftables.connect(owner).treasuryMint();
    // TokenIds 1 - 1000 are now minted to owner

    console.log('************* PREREVEAL *************');

    // confirm metadata isnt revealed yet
    const firstFive = generateTokenIdArray(1, 3); // [1,2,3]
    const lastFive = generateTokenIdArray(998, 3); // [998, 998, 1000]
    await asyncForEach([...firstFive, ...lastFive], async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      console.log(`Uri for :: ${id} :: ${uri}`);
      expect(uri).to.equal(BASE_PREREVEAL_URL);
    });

    console.log('************* MINT 1001 *************');
    // 1000 tokens minted in constructor. Mint another 1001 so we're at 2001
    // 1 batch of
    // 1 over into second, un-revealed batch
    let mintCount = 1001;
    let amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.setIsPublicSaleActive(true);
    await kiftables.setBaseURI(IPFS_BASE_URL);
    await kiftables.connect(addr1).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    console.log('************* REVEAL 1 - 1000 *************');
    // REVEAL 2 BATCHES [0 - 2000]  (the first 1000 in the treasure and 1000 minted by "public")
    const tx0 = await kiftables.revealNextBatch();
    await tx0.wait();
    let lastTokenRevealed = await kiftables.revealCount();
    console.log(`Revealed up until: ${lastTokenRevealed}`);
    console.log('************* REVEAL 1001 - 2000 *************');
    const tx1 = await kiftables.revealNextBatch();
    await tx1.wait();
    lastTokenRevealed = await kiftables.revealCount();
    console.log(`Revealed up until: ${lastTokenRevealed}`);

    let seed0 = await kiftables.getSeedForBatch(0);
    console.log('Seed0: ', seed0.toString());
    let seed1 = await kiftables.getSeedForBatch(1);
    console.log('Seed1: ', seed1.toString());

    // tokenIds < 2000 should return a valid int.json file. 2001 returns baseUri
    await asyncForEach([1, 2, 3, 2000, 2001], async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      let shuffledId = await kiftables.getShuffledTokenId(id);
      console.log(`Uri for :: ${id} :: ${shuffledId} :: ${uri}`);
      if (id >= 2000) {
        // expect(uri.indexOf(IPFS_BASE_URL)).to.lessThan(0);
      } else {
        expect(uri.indexOf(IPFS_BASE_URL)).to.equal(0);
      }
    });

    console.log('************* MINT 1000 (2001 - 3001) *************');
    mintCount = 1000;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.connect(addr2).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    const tx2 = await kiftables.revealNextBatch();
    await tx2.wait();
    lastTokenRevealed = await kiftables.revealCount();
    console.log(`Revealed up until: ${lastTokenRevealed}`);

    let seed2 = await kiftables.getSeedForBatch(2);
    console.log('Seed2: ', seed2.toString());

    // 2000 is from batch 1.
    // 2001 -> 3000 are revealed in batch 2.
    // 3001 is minted but not revealed
    await asyncForEach([2000, 2001, 3000, 3001], async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      let shuffledId = await kiftables.getShuffledTokenId(id);
      console.log(`Uri for :: ${id} :: ${shuffledId} :: ${uri}`);
      if (id >= 3000) {
        // expect(uri.indexOf(IPFS_BASE_URL)).to.lessThan(0);
      } else {
        // expect(uri.indexOf(IPFS_BASE_URL)).to.equal(0);
      }
    });

    // TODO mint all the way up to 10000 and confirm not overflows/offset issues
    console.log(
      '************* MINT REMAINING 6999 (3001 - 10000) *************'
    );

    mintCount = 10000 - (await kiftables.count());
    console.log('Remaining Tokens to mint: ', mintCount);
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.connect(addr3).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    const totalMinted = parseInt(await kiftables.count());
    console.log('Total Minted thus far: ', totalMinted);
    expect(totalMinted).to.equal(10000);

    const remainingBatches = [3, 4, 5, 6, 7, 8, 9]; // 10 batches, base 0
    await asyncForEach(remainingBatches, async (batch) => {
      await kiftables.revealNextBatch();
      let seed = await kiftables.getSeedForBatch(batch);
      console.log(`Seed for batch ${batch}: ${seed}`);
      lastTokenRevealed = await kiftables.revealCount();
      console.log(`Revealed up until: ${lastTokenRevealed}`);
    });

    await asyncForEach(
      [
        1, 2, 3, 1000, 1001, 1002, 2001, 2001, 2002, 3000, 3001, 3002, 4000,
        4001, 4002, 5000, 5001, 5002, 6000, 6001, 6002, 6003, 7000, 7001, 7002,
        8000, 8001, 8002, 9000, 9001, 9002, 9998, 9999, 10000
      ],
      async (id, idx) => {
        let uri = await kiftables.tokenURI(id);
        let shuffledId = await kiftables.getShuffledTokenId(id);
        console.log(`Uri for tokenId: ${id.toString().padStart(4, '0')} :: shuffledId: ${shuffledId} :: path: ${uri}`);
        expect(uri.indexOf(IPFS_BASE_URL)).to.equal(0);
      }
    );
  });
});
