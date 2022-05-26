const { expect } = require('chai');
const { ethers } = require('hardhat');
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const {
  BASE_PREREVEAL_URL,
  IPFS_BASE_URL,
  CHAINLINK_KEY_HASH
} = require('../config/config');
const { asyncForEach, generateTokenIdArray } = require('./helpers/utilities');

const buf2hex = (x) => '0x' + x.toString('hex');

describe('Kiftables Run Through', async () => {
  const TREASURY_SIZE = 1000;
  const COLLECTION_SIZE = 10000;
  const MAX_BATCH_COUNT = 112;
  const AIRDROP_CONTRIB_COUNT = 5;
  const REVEAL_BATCH_SIZE = 200;

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

    const MOCK_SUBSCRIPTION_ID = 0;
    // const MOCK_LINK = constants.AddressZero;        // not needed
    const vrfCoordinatorContract = 'MockVRFCoordinator';

    // deploy
    const kiftContractFactory = await ethers.getContractFactory('Kiftables');
    const vrfCoordFactory = await ethers.getContractFactory(
      vrfCoordinatorContract
    );
    const mockVrfCoordinator = await vrfCoordFactory.connect(owner).deploy();

    kiftables = await kiftContractFactory.deploy(
      BASE_PREREVEAL_URL,
      CHAINLINK_KEY_HASH,
      mockVrfCoordinator.address,
      MOCK_SUBSCRIPTION_ID
    );
  });

  it('Initial conditions are correct', async () => {
    expect(await kiftables.preRevealBaseURI()).to.equal(BASE_PREREVEAL_URL);

    const maxKiftables = await kiftables.maxKiftables();
    const batchSize = await kiftables.REVEAL_BATCH_SIZE();
    expect(maxKiftables).to.equal(COLLECTION_SIZE);
    expect(maxKiftables % batchSize).to.equal(0); // needs to divide cleanly
    expect(maxKiftables / batchSize).to.lessThan(MAX_BATCH_COUNT); // needs to be less than 112
  });

  it('Initial counters are all 0', async () => {
    expect(await kiftables.counter()).to.equal(0);
    expect(await kiftables.lastTokenRevealed()).to.equal(0);
  });

  it('Owner transfer to Gnosis Safe', async () => {
    await kiftables.connect(owner).transferOwnership(gnosisSafe.address);
    expect(await kiftables.owner()).to.equal(gnosisSafe.address);
  });

  it('Successfully sets the base url', async () => {
    await kiftables.connect(gnosisSafe).setBaseURI(IPFS_BASE_URL);
    expect(await kiftables.baseURI()).to.equal(IPFS_BASE_URL);
  });

  it('Dont allow transfer of un-minted token', async () => {
    await expect(
      kiftables
        .connect(gnosisSafe)
        ['safeTransferFrom(address,address,uint256)'](
          owner.address,
          community1.address,
          0
        )
    ).to.be.revertedWithCustomError(kiftables, 'OwnerQueryForNonexistentToken');

    await expect(
      kiftables
        .connect(public1)
        ['safeTransferFrom(address,address,uint256)'](
          public1.address,
          public2.address,
          0
        )
    ).to.be.revertedWithCustomError(kiftables, 'OwnerQueryForNonexistentToken');
  });

  it('Successfully mints the treasury', async () => {
    expect(await kiftables.treasuryMinted()).to.equal(false);
    await kiftables.connect(gnosisSafe).treasuryMint();
    expect(await kiftables.treasuryMinted()).to.equal(true);
    expect(await kiftables.counter()).to.equal(TREASURY_SIZE);
    // TODO :
    // Should the counter by 999 or 1000 here?
    // After minting 1000 tokens, the counter should be 999 but it's 1000
  });

  it('Airdrop contributor tokens', async () => {
    let tokenIds = generateTokenIdArray(0, AIRDROP_CONTRIB_COUNT);
    await kiftables.connect(gnosisSafe).airdrop(contrib1.address, tokenIds);
    tokenIds = generateTokenIdArray(5, AIRDROP_CONTRIB_COUNT);
    await kiftables.connect(gnosisSafe).airdrop(contrib2.address, tokenIds);

    expect(await kiftables.balanceOf(contrib1.address)).to.equal(
      AIRDROP_CONTRIB_COUNT
    );
    expect(await kiftables.balanceOf(contrib2.address)).to.equal(
      AIRDROP_CONTRIB_COUNT
    );
  });

  it('Show IPFS prereveal metadata', async () => {
    const firstToken = 0;
    const lastToken = (await kiftables.counter()).toNumber();
    expect(await kiftables.tokenURI(firstToken)).to.equal(BASE_PREREVEAL_URL);
    expect(await kiftables.tokenURI(lastToken - 1)).to.equal(
      BASE_PREREVEAL_URL
    );
    await expect(kiftables.tokenURI(lastToken)).to.be.revertedWith(
      'Nonexistent token'
    );
  });

  it('Reverts community sale if not active', async () => {
    const proof = [];
    await expect(
      kiftables
        .connect(community1)
        .mintCommunitySale(1, proof, { value: ethers.utils.parseEther('0.08') })
    ).to.be.revertedWith('Community sale is not active');
  });

  it('Reverts public sale if not active', async () => {
    await expect(
      kiftables
        .connect(public1)
        .mint(1, { value: ethers.utils.parseEther('0.1') })
    ).to.be.revertedWith('Public sale is not active');
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

    await expect(
      kiftables
        .connect(public1)
        .mintCommunitySale(1, proof, { value: ethers.utils.parseEther('0.08') })
    ).to.revertedWith('Address not in list or incorrect proof');
  });

  /**
   * If you're airdropped 5 tokens, you should still be able to mint up to 5 during community sale
   */
  it('Allow contributors to community mint after airdrop', async () => {
    const proof = allowListTree.getHexProof(allowListHash[0]);
    mintCount = 5;
    amount = parseFloat((0.08 * mintCount).toString()).toFixed(2);
    await kiftables.connect(contrib1).mintCommunitySale(mintCount, proof, {
      value: ethers.utils.parseEther(amount)
    });
    expect(await kiftables.balanceOf(contrib1.address)).to.equal(
      mintCount + AIRDROP_CONTRIB_COUNT
    );
  });

  it('Dont allow community mint over max per wallet', async () => {
    const proof = allowListTree.getHexProof(allowListHash[2]);
    mintCount = 5;
    amount = parseFloat((0.08 * mintCount).toString()).toFixed(2);
    await expect(
      kiftables.connect(community1).mintCommunitySale(mintCount, proof, {
        value: ethers.utils.parseEther(amount)
      })
    ).to.be.revertedWith('Max Kiftables to mint in community sale is five');
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

    /**
   * If you're airdropped 5 tokens, you should still be able to mint up to 5 during community sale
   */
     it('Allow contributors to public mint', async () => {
       console.log('Contrib 1 balance: ', await kiftables.balanceOf(contrib1.address));
       console.log('Contrib 2 balance: ', await kiftables.balanceOf(contrib2.address));
      mintCount = 5;
      amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
      await kiftables.connect(contrib2).mint(mintCount, {
        value: ethers.utils.parseEther(amount)
      });
      expect(await kiftables.balanceOf(contrib2.address)).to.equal(
        mintCount + AIRDROP_CONTRIB_COUNT
      );
    });

  it('Dont allow public mint over max per wallet', async () => {
    mintCount = 5;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
    await expect(
      kiftables.connect(public1).mint(mintCount, {
        value: ethers.utils.parseEther(amount)
      })
    ).to.be.revertedWith('Max Kiftables to mint is five');
  });

  it('Dont allow incorrect ETH payment', async () => {
    mintCount = 1000;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
    error = 1;
    await expect(
      kiftables.connect(public2).mint(mintCount, {
        value: ethers.utils.parseEther((amount - error).toString())
      })
    ).to.be.revertedWith('Incorrect ETH value sent');

    await expect(
      kiftables.connect(public2).mint(mintCount, {
        value: ethers.utils.parseEther((amount + error).toString())
      })
    ).to.be.revertedWith('Incorrect ETH value sent');
  });

  it('Reveal Minted Tokens', async () => {
    const lastToken = (await kiftables.counter()).toNumber();
    const batchesCount = Math.floor(lastToken / REVEAL_BATCH_SIZE);
    batches = [];
    for (let i = 0; i < batchesCount; i++) {
      batches.push(kiftables.connect(gnosisSafe).revealNextBatch());
    }
    await Promise.all(batches);

    const firstToken = 0;
    const lastRevealed = (await kiftables.lastTokenRevealed()).toNumber();
    expect(
      (await kiftables.tokenURI(firstToken)).indexOf(IPFS_BASE_URL)
    ).to.equal(0);
    expect(
      (await kiftables.tokenURI(lastRevealed - 1)).indexOf(IPFS_BASE_URL)
    ).to.equal(0);
    expect(
      (await kiftables.tokenURI(lastRevealed)).indexOf(IPFS_BASE_URL)
    ).to.be.lessThan(0);
  });

  it('Entire collection can be minted', async () => {
    // mint 6995 tokens
    mintCount = 1000;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
    let eth = { value: ethers.utils.parseEther(amount) };
    await kiftables.connect(community2).mint(mintCount, eth);
    await kiftables.connect(community3).mint(mintCount, eth);
    await kiftables.connect(community4).mint(mintCount, eth);
    await kiftables.connect(public2).mint(mintCount, eth);
    await kiftables.connect(public3).mint(mintCount, eth);
    await kiftables.connect(public4).mint(mintCount, eth);
    mintCount = 990;
    amount = parseFloat((0.1 * mintCount).toString()).toFixed(2);
    eth = { value: ethers.utils.parseEther(amount) };
    await kiftables.connect(contrib2).mint(mintCount, eth);
  });

  it('Reveal Entire Collection', async () => {
    const lastMintedToken = (await kiftables.counter()).toNumber();
    const lastRevealedToken = (await kiftables.lastTokenRevealed()).toNumber();
    // reveal the remaining 35 batches
    const batchesCount = Math.floor(
      (lastMintedToken - lastRevealedToken) / REVEAL_BATCH_SIZE
    );
    batches = [];
    for (let i = 0; i < batchesCount; i++) {
      batches.push(kiftables.connect(gnosisSafe).revealNextBatch());
    }
    await Promise.all(batches);

    const firstToken = 0;
    const lastRevealed = (await kiftables.lastTokenRevealed()).toNumber();
    expect(lastRevealed).to.equal(COLLECTION_SIZE);
    expect(
      (await kiftables.tokenURI(firstToken)).indexOf(IPFS_BASE_URL)
    ).to.equal(0);
    expect(
      (await kiftables.tokenURI(lastRevealed - 1)).indexOf(IPFS_BASE_URL)
    ).to.equal(0);
  });

  it('Stop minting at end of collection', async () => {
    await expect(
      kiftables.connect(gnosisSafe).mint(1, {
        value: ethers.utils.parseEther('0.1')
      })
    ).to.be.revertedWith('Not enough Kiftables remaining to mint');
  });

  it('Has all the money', async () => {
    let balance = await kiftables.provider.getBalance(kiftables.address);
    balance = ethers.utils.formatUnits(balance.toString(), 'ether');
    const expected =
      (COLLECTION_SIZE - TREASURY_SIZE - 1005) * 0.1 + 1005 * 0.08;
    expect(balance).to.equal(expected.toString());
  });

  it('Can airdrop new contributor', async () => {
    expect(await kiftables.balanceOf(gnosisSafe.address)).to.equal(
      TREASURY_SIZE - 2 * AIRDROP_CONTRIB_COUNT
    );
    let tokenIds = generateTokenIdArray(10, AIRDROP_CONTRIB_COUNT);
    await kiftables
      .connect(gnosisSafe)
      .airdrop(newContributor.address, tokenIds);
    expect(await kiftables.balanceOf(gnosisSafe.address)).to.equal(
      TREASURY_SIZE - 3 * AIRDROP_CONTRIB_COUNT
    );
  });

  it('Cannot transfer the same token twice', async () => {
    let tokenIds = generateTokenIdArray(10, AIRDROP_CONTRIB_COUNT);
    await expect(
      kiftables.connect(gnosisSafe).airdrop(newContributor.address, tokenIds)
    ).to.revertedWithCustomError(kiftables, 'TransferFromIncorrectOwner');
  });

  it('Non-owner cannot transfer tokens', async () => {
    let tokenIds = generateTokenIdArray(15, AIRDROP_CONTRIB_COUNT);
    await expect(
      kiftables.connect(owner).airdrop(newContributor.address, tokenIds)
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });
});
