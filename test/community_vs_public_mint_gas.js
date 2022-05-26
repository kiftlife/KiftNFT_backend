const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const {
  BASE_PREREVEAL_URL,
  IPFS_BASE_URL,
  CHAINLINK_KEY_HASH
} = require('../config/config');
const { asyncForEach, generateTokenIdArray, deployAllContracts } = require('./helpers/utilities');

const buf2hex = (x) => '0x' + x.toString('hex');

describe('Compare Community vs Public Mint Gas Fees', async () => {
  const TREASURY_SIZE = 1000;
  const COLLECTION_SIZE = 10000;
  const MAX_BATCH_COUNT = 112;
  const AIRDROP_CONTRIB_COUNT = 5;


  let kiftables,
    owner,
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
      owner,
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




  it('Owner transfer to Gnosis Safe', async () => {
    await kiftables.connect(owner).transferOwnership(gnosisSafe.address);
    expect(await kiftables.owner()).to.equal(gnosisSafe.address);
  });



  it('Should set the community sale merkle root', async () => {
    allowListHash = [
      contrib1,
      contrib2,
      community1,
      community2,
      community3,
      community4
    ].map((signer) => keccak256(signer.address));
    allowListTree = new MerkleTree(allowListHash, keccak256, {
      sortPairs: true
    });

    const allowListRoot = buf2hex(allowListTree.getRoot());
    await kiftables
      .connect(gnosisSafe)
      .setCommunityListMerkleRoot(allowListRoot);

    expect(await kiftables.communityListMerkleRoot()).to.equal(allowListRoot);
  });

  it('Allow community sale to allowList Member', async () => {
    await kiftables.connect(gnosisSafe).setIsCommunitySaleActive(true);
    const proof = allowListTree.getHexProof(allowListHash[2]);
    mintCount = 1000;
    amount = parseFloat((0.08 * mintCount).toString()).toFixed(2);
    await kiftables.connect(community1).mintCommunitySale(mintCount, proof, {
      value: ethers.utils.parseEther(amount)
    });
    expect(await kiftables.balanceOf(community1.address)).to.equal(mintCount);

  });

  it('Allow public mint', async () => {
    await kiftables.connect(gnosisSafe).setIsCommunitySaleActive(false);
    await kiftables.connect(gnosisSafe).setIsPublicSaleActive(true);
    mintCount = 1000;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
    await kiftables.connect(public1).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });
    expect(await kiftables.balanceOf(public1.address)).to.equal(mintCount);
  });


});