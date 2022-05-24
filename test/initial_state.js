const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');
const { deployAllContracts } = require('./helpers/utilities');

describe('Confirm initial states and zerod counters', async () => {
  const COLLECTION_SIZE = 10000;
  const MAX_BATCH_COUNT = 112;

  let kiftables, owner, contrib1, contrib2;

  before(async () => {
    [owner, contrib1, contrib2] = await ethers.getSigners();
    kiftables = await deployAllContracts();
});

  it('Initial conditions are correct', async () => {
    expect(await kiftables.preRevealBaseURI()).to.equal(BASE_PREREVEAL_URL);

    const maxKiftables = await kiftables.maxKiftables();
    const batchSize = await kiftables.REVEAL_BATCH_SIZE();
    expect(maxKiftables).to.equal(COLLECTION_SIZE);
    expect(maxKiftables % batchSize).to.equal(0); // needs to divide cleanly
    expect(maxKiftables / batchSize).to.lessThan(MAX_BATCH_COUNT); // needs to be less than 112
  });

  it('Everyone defaults to zero airdropped tokens', async () => {
    const contrib1Count = await kiftables.airdropCounts(contrib1.address);
    const contrib2Count = await kiftables.airdropCounts(contrib2.address);
    expect(contrib1Count).to.equal(0);
    expect(contrib2Count).to.equal(0);
  });
});
