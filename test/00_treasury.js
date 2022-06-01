const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployAllContracts } = require('./helpers/utilities');

describe('Mint Treasury', async () => {
  const TREASURY_SIZE = 1000;
  let kiftables, deployer, contrib1, contrib2, gnosisSafe;

  before(async () => {
    [deployer, gnosisSafe, contrib1, contrib2] = await ethers.getSigners();
    kiftables = await deployAllContracts();
  });

  it('Allow deployer to mint treasury for the safe', async () => {
    await kiftables.connect(deployer).treasuryMint();
    expect(await kiftables.balanceOf(gnosisSafe.address)).to.equal(
      TREASURY_SIZE
    );
    expect(await kiftables.balanceOf(deployer.address)).to.equal(0);
  });

  it('Shouldnt allow treasury to be minted twice', async () => {
    await expect(kiftables.connect(deployer).treasuryMint()).to.be.revertedWith(
      'Treasury can only be minted once'
    );
  });

  it('Dont allow airdrop while safe isnt owner of contract', async () => {
    await expect(
      kiftables
        .connect(gnosisSafe)
        .airdrop(contrib1.address, [0, 1])
    ).to.be.revertedWith('Ownable: caller is not the owner');
  });

  it('Should allow safe to airdrop tokens after transfer', async () => {
    await kiftables.connect(deployer).transferOwnership(gnosisSafe.address);
    await kiftables.connect(gnosisSafe).airdrop(deployer.address, [0, 1]);
    expect(await kiftables.balanceOf(deployer.address)).to.equal(2);
    expect(await kiftables.balanceOf(gnosisSafe.address)).to.equal(
      TREASURY_SIZE - 2
    );
  });
});
