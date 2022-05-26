const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const {
  deployAllContracts,
  generateTokenIdArray,
  asyncForEach
} = require('./helpers/utilities');

const buf2hex = (x) => '0x' + x.toString('hex');

const CONTRIBUTOR_AIRDROP_COUNT = 5;
const SECOND_AIRDROP_COUNT = 2;
const MAX_KIFTABLES_PER_WALLET = 5;

describe('Airdrop Contributors', () => {
  let kiftables, deployer, contrib1, contrib2, community1, public1, gnosisSafe;
  let allowListHash, allowListTree, allowListRoot;

  before(async () => {
    [deployer, contrib1, contrib2, community1, public1, gnosisSafe] =
      await ethers.getSigners();
    kiftables = await deployAllContracts();
    await kiftables.connect(deployer).transferOwnership(gnosisSafe.address);
    await kiftables.connect(gnosisSafe).treasuryMint();

    allowListHash = [contrib1, contrib2, community1].map((signer) =>
      keccak256(signer.address)
    );
    allowListTree = new MerkleTree(allowListHash, keccak256, {
      sortPairs: true
    });

    allowListRoot = buf2hex(allowListTree.getRoot());
  });

  it('Gnosis should Airdrop to Contributors', async () => {
    await asyncForEach([contrib1, contrib2], async (contrib, idx) => {
      const { address } = contrib;
      const tokenIds = generateTokenIdArray(idx * 5, CONTRIBUTOR_AIRDROP_COUNT); // [0,1,2,3,4], [5,6,7,8,9] etc
      await kiftables.connect(gnosisSafe).airdrop(address, tokenIds);
      const balance = await kiftables.balanceOf(address);
      expect(balance).to.equal(CONTRIBUTOR_AIRDROP_COUNT);
    });
  });

  it('Airdrop counts should be updated', async () => {
    await asyncForEach([contrib1, contrib2], async (contrib, idx) => {
      const { address } = contrib;
      const airdropBalance = await kiftables.airdropCounts(address);
      expect(airdropBalance).to.equal(CONTRIBUTOR_AIRDROP_COUNT);
    });
  });

  it('Airdrop counts should stay updated', async () => {
    await asyncForEach([contrib1, contrib2], async (contrib, idx) => {
      const { address } = contrib;
      const tokenIds = generateTokenIdArray(idx * 2 + 10, SECOND_AIRDROP_COUNT); // [10, 11], [12, 13]
      await kiftables.connect(gnosisSafe).airdrop(address, tokenIds);
      expect(await kiftables.balanceOf(address)).to.equal(
        CONTRIBUTOR_AIRDROP_COUNT + SECOND_AIRDROP_COUNT
      );
      expect(await kiftables.airdropCounts(address)).to.equal(
        CONTRIBUTOR_AIRDROP_COUNT + SECOND_AIRDROP_COUNT
      );
    });
  });

  it('Airdrop counts shouldnt be reflect in community mint', async () => {
    await kiftables
      .connect(gnosisSafe)
      .setCommunityListMerkleRoot(allowListRoot);

    expect(await kiftables.communityListMerkleRoot()).to.equal(allowListRoot);

    await kiftables.connect(gnosisSafe).setIsCommunitySaleActive(true);

    let proof = allowListTree.getHexProof(allowListHash[0]);
    mintCount = 3;
    amount = parseFloat((0.08 * mintCount).toString()).toFixed(2);
    await kiftables.connect(contrib1).mintCommunitySale(mintCount, proof, {
      value: ethers.utils.parseEther(amount)
    });

    expect(await kiftables.balanceOf(contrib1.address)).to.equal(
      CONTRIBUTOR_AIRDROP_COUNT + SECOND_AIRDROP_COUNT + mintCount
    );
    expect(await kiftables.airdropCounts(contrib1.address)).to.equal(
      CONTRIBUTOR_AIRDROP_COUNT + SECOND_AIRDROP_COUNT
    );
  });

  it('Airdrop count stays 0 for community member', async () => {
    proof = allowListTree.getHexProof(allowListHash[2]);
    await kiftables.connect(community1).mintCommunitySale(mintCount, proof, {
      value: ethers.utils.parseEther(amount)
    });

    expect(await kiftables.balanceOf(community1.address)).to.equal(mintCount);
    expect(await kiftables.airdropCounts(community1.address)).to.equal(0);
  });

  it('Airdrop shouldnt prevent public mint', async () => {
    await kiftables.connect(gnosisSafe).setIsCommunitySaleActive(false);
    await kiftables.connect(gnosisSafe).setIsPublicSaleActive(true);

    mintCount = 2; // can mint 5 - communityMintCount = 2
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
    await kiftables.connect(contrib1).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    expect(await kiftables.balanceOf(contrib1.address)).to.equal(
      CONTRIBUTOR_AIRDROP_COUNT + SECOND_AIRDROP_COUNT + 5
    );
    expect(await kiftables.airdropCounts(contrib1.address)).to.equal(
      CONTRIBUTOR_AIRDROP_COUNT + SECOND_AIRDROP_COUNT
    );
  });

  it('Shouldnt allow an airdrop recipient to mint more than 5 after selling out', async () => {
    const contrib1BalanceBefore = await kiftables.balanceOf(contrib1.address);
    const contrib1AirdropBefore = await kiftables.airdropCounts(
      contrib1.address
    );
    console.log(
      'Contrib1 balance and airdrop: ',
      contrib1BalanceBefore,
      contrib1AirdropBefore
    );
    // TODO figure out what tokens contrib1 has
    const contrib1TokenIds = [0, 1, 2, 3, 4, 10, 11, ];
    await asyncForEach()
    await kiftables
      .connect(contrib1)
      ['safeTransferFrom(address,address,uint256)'](
        contrib1.address,
        public1.address,
        0
      )
      .transferFrom(contrib1.address, public1.address, contrib1BalanceBefore);
    expect(await kiftables.balanceOf(contrib1.address)).to.equal(0);
    

    mintCount = MAX_KIFTABLES_PER_WALLET + contrib1AirdropBefore; // 12
      
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
    await kiftables.connect(contrib1).mint(mintCount, {
      value: ethers.utils.parseEther(amount)
    });

    expect(await kiftables.balanceOf(contrib1.address)).to.equal(12);

  });
});
