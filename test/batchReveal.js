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

    // confirm metadata isnt revealed yet
    // tokenIds = [1,2,3,4,5]
    const firstFive = generateTokenIdArray(1, 5);
    await asyncForEach(firstFive, async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      console.log(`Uri for :: ${id} :: ${uri}`);
      expect(uri).to.equal(BASE_PREREVEAL_URL);
    });

    // confirm metadata isnt revealed yet
    // tokenIds = [996, 997, 998, 999, 1000]
    const lastFive = generateTokenIdArray(996, 5);
    await asyncForEach(lastFive, async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      console.log(`Uri for :: ${id} :: ${uri}`);
      expect(uri).to.equal(BASE_PREREVEAL_URL);
    });

    // 1000 tokens minted in constructor. Mint another 1001 so we're at 2001
    // 1 batch of 
    // 1 over into second, un-revealed batch
    let mintCount = 1001;
    let amount = parseFloat((0.1 * mintCount).toString()).toFixed(1);   // hack city
    console.log('Amount: ', amount)
    await kiftables.setIsPublicSaleActive(true);
    await kiftables.setBaseURI(IPFS_BASE_URL)
    await kiftables.connect(addr1).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    // REVEAL 2 BATCHES [0 - 2000]  (the first 1000 in the treasure and 1000 minted by "public")
    const tx0 = await kiftables.revealNextBatch();
    await tx0.wait();
    const tx1 = await kiftables.revealNextBatch();
    await tx1.wait();

    let seed0 = await kiftables.getSeedForBatch(0);
    console.log('Seed0: ', seed0.toString());
    let seed1 = await kiftables.getSeedForBatch(1);
    console.log('Seed1: ', seed1.toString());

    // tokenIds < 2000 should return a valid int.json file. 2001 returns baseUri
    await asyncForEach([1, 2, 3, 2000, 2001], async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      let shuffledId = await kiftables.getShuffledTokenId(id);
      console.log(`Uri for :: ${id} :: ${shuffledId} :: ${uri}`);
      if(id > 2000) {
        expect(uri.indexOf(IPFS_BASE_URL)).to.lessThan(0)
      } else {
        expect(uri.indexOf(IPFS_BASE_URL)).to.equal(0)
      }
    });

    // 
    mintCount = 1000;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(1);   // hack city
    console.log('Amount: ', amount);
    await kiftables.connect(addr2).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    const tx2 = await kiftables.revealNextBatch();
    await tx2.wait();

    let seed2 = await kiftables.getSeedForBatch(2);
    console.log('Seed2: ', seed2.toString());

    // 2000 is from batch 1. 
    // 2001 -> 3000 are revealed in batch 2. 
    // 3001 is minted but not revealed
    await asyncForEach([2000, 2001, 3000, 3001], async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      let shuffledId = await kiftables.getShuffledTokenId(id);
      console.log(`Uri for :: ${id} :: ${shuffledId} :: ${uri}`);
      if(id > 3000) {
        expect(uri.indexOf(IPFS_BASE_URL)).to.lessThan(0)
      } else {
        expect(uri.indexOf(IPFS_BASE_URL)).to.equal(0)
      }
    });

    // TODO mint all the way up to 10000 and confirm not overflows/offset issues
  });
});
