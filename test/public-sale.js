const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deployAllContracts } = require('./utilities');

describe('Public Whitelist', function () {
  it('Should allow public mint', async function () {
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    console.log('Addr 5: ', addr5.address);

    // deploy
    const kiftables = await deployAllContracts();

    await kiftables.setIsPublicSaleActive(true);

    await kiftables.connect(addr5).mint(3, {
      value: ethers.utils.parseEther('0.30')
    });

    balance = await kiftables.balanceOf(addr5.address);
    console.log('Balance: ', balance)
    // expect(balance).to.equal(1);
  });
});
