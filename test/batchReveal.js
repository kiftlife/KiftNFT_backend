const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL, IPFS_BASE_URL } = require('../config/config');
const {
  deployAllContracts,
  asyncForEach,
  generateTokenIdArray
} = require('./helpers/utilities');

describe('BatchReveal', async () => {
  it('Should run', () => {
    console.log('Testing batch reveal');
  });

  it('Successfully batch reveal 10000 tokens', async () => {
    // setup
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    console.log('Owner: ', owner.address);

    // deploy
    const kiftables = await deployAllContracts();
    await kiftables.setBaseURI(IPFS_BASE_URL);

    // treasury mint.
    await kiftables.connect(owner).treasuryMint();
    // TokenIds 0 - 999 are now minted to owner

    console.log('************* PREREVEAL *************');

    // confirm metadata isnt revealed yet
    const firstFive = generateTokenIdArray(0, 3); // [0,1,2]
    const lastFive = generateTokenIdArray(997, 3); // [997, 998, 999]
    await asyncForEach([...firstFive, ...lastFive], async (id, idx) => {
      let uri = await kiftables.tokenURI(id);
      console.log(`Uri for :: ${id} :: ${uri}`);
      expect(uri).to.equal(BASE_PREREVEAL_URL);
    });

    console.log('************* MINT 1001 *************');
    // 1000 tokens minted in constructor. Mint another 1001 so we're at 2000
    // 1 batch of 1000 minted tokens [0 - 999]
    // 1 over into second, un-revealed batch [1000 - 1999]
    let mintCount = 1001;
    let amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.setIsPublicSaleActive(true);

    await kiftables.connect(addr1).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });
    console.log('************* MINT 1000 (2001 - 3001) *************');
    mintCount = 1000;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.connect(addr2).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    console.log(
      '************* MINT REMAINING 6999 (3001 - 9999) *************'
    );

    mintCount = 10000 - (await kiftables.counter());
    console.log('Remaining Tokens to mint: ', mintCount);
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(1); // hack city
    await kiftables.connect(addr3).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    const totalMinted = parseInt(await kiftables.counter());
    expect(totalMinted).to.equal(10000);

    const remainingBatches = generateTokenIdArray(0, 10000 / 200);
    console.log('remaining batches');
    await asyncForEach(remainingBatches, async (batch) => {
      await kiftables.revealNextBatch();
      let seed = await kiftables.batchToSeed(batch);
      console.log(`Seed for batch ${batch}: ${seed}`);
      lastTokenRevealed = await kiftables.lastTokenRevealed();
      console.log(`Revealed up until: ${lastTokenRevealed}`);
    });

    await asyncForEach(
      [
        0,
        1,
        2,
        198,
        199, // batch 0
        200,
        201,
        398,
        399, // batch 1
        400,
        401,
        598,
        599, // batch 2
        600,
        601,
        798,
        799, // batch 3
        800,
        801,
        998,
        999, // batch 4
        1000,
        1001,
        1198,
        1199, // batch 5
        1200,
        1201,
        1398,
        1399, // batch 6
        1400,
        1401,
        1598,
        1599, // batch 7
        1600,
        1601,
        1798,
        1799, // batch 8
        1800,
        1801,
        1998,
        1999, // batch 9
        2000,
        2001,
        2998,
        2999,
        3000,
        3001,
        3998,
        3999,
        4000,
        4001,
        4998,
        4999,
        8000,
        8001,
        8998,
        8998,
        9000,
        9001,
        9998,
        9999
      ],
      async (id, idx) => {
        // let uri = await kiftables.tokenURI(id);
        let shuffledId = await kiftables.getShuffledTokenId(id);
        console.log(
          `Uri for tokenId: ${id} :: shuffledId: ${shuffledId}`
        );
      }
    );
  });
});
