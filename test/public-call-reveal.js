const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const {
  BASE_PREREVEAL_URL,
  IPFS_BASE_URL,
  CHAINLINK_KEY_HASH
} = require('../config/config');
const {
  asyncForEach,
  generateTokenIdArray,
  deployAllContracts
} = require('./helpers/utilities');

const buf2hex = (x) => '0x' + x.toString('hex');

describe('Only owner should not be able to call reveal', async () => {
  const TREASURY_SIZE = 1000;
  const COLLECTION_SIZE = 10000;
  const MAX_BATCH_COUNT = 112;
  const AIRDROP_CONTRIB_COUNT = 5;
  const BATCH_SIZE = 200;

  let kiftables,
    deployer,
    contrib1,
    contrib2,
    community1,
    community2,
    community3,
    community4,
    public1,
    public2,
    public3,
    public4,
    gnosisSafe,
    newContributor;

  let allowListHash, allowListTree;

  it('Successfully deploys all contracts', async () => {
    [
      deployer,
      contrib1,
      contrib2,
      community1,
      community2,
      community3,
      community4,
      public1,
      public2,
      public3,
      public4,
      gnosisSafe,
      newContributor
    ] = await ethers.getSigners();

    kiftables = await deployAllContracts();
  });

  it('Deployer transfer to Gnosis Safe', async () => {
    await kiftables.connect(deployer).transferOwnership(gnosisSafe.address);
    expect(await kiftables.owner()).to.equal(gnosisSafe.address);
  });

  it('Owner should be able to mint treasury', async () => {
    await kiftables.connect(gnosisSafe).treasuryMint();
    expect(await kiftables.treasuryMinted()).to.equal(true);
    expect(await kiftables.counter()).to.equal(TREASURY_SIZE);
  });

  it('Shouldnt allow non-owner to call batch reveal', async () => {
    await expect(kiftables.connect(deployer).revealNextBatch()).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });

  it('Owner can call batch reveal', async () => {
    await kiftables.connect(gnosisSafe).revealNextBatch();
    expect(await kiftables.lastTokenRevealed()).to.equal(BATCH_SIZE)
  });
});
