const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployAllContracts } = require('./helpers/utilities');

describe('Mint Treasury', async () => {
  const TREASURY_SIZE = 1000;
  let kiftables, deployer, contrib1, contrib2, gnosisSafe;

  before(async () => {
    [deployer, contrib1, contrib2, gnosisSafe] = await ethers.getSigners();
    kiftables = await deployAllContracts();
    await kiftables.connect(deployer).transferOwnership(gnosisSafe.address);
  });

  it('Shouldnt allow non-owner to mint', async () => {
    await expect(kiftables.connect(deployer).treasuryMint()).to.be.revertedWith(
      'Ownable: caller is not the owner'
    );
  });

  it('Successfully mints treasury', async () => {
    expect(await kiftables.treasuryMinted()).to.equal(false);
    await kiftables.connect(gnosisSafe).treasuryMint();
    expect(await kiftables.treasuryMinted()).to.equal(true);
    expect(await kiftables.counter()).to.equal(TREASURY_SIZE);
  });

  it('Shouldnt allow treasury to be minted twice', async () => {
    await expect(
      kiftables.connect(gnosisSafe).treasuryMint()
    ).to.be.revertedWith('Treasury can only be minted once');
  });
});
