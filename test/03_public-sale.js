const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployAllContracts } = require('./utilities');

const MINT_COUNT = 3

describe('Public Whitelist', function () {
  it('Should allow public mint', async function () {
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    console.log('Addr 5: ', addr5.address);

    // deploy
    const kiftables = await deployAllContracts();

    await kiftables.connect(owner).setIsPublicSaleActive(true);

    await kiftables.connect(addr5).mint(MINT_COUNT, {
      value: ethers.utils.parseEther(parseFloat((0.1 * MINT_COUNT).toString()).toFixed(1))
    });

    balance = await kiftables.balanceOf(addr5.address);
    expect(balance).to.equal(MINT_COUNT);
  });
});
