
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');

  describe('Public Whitelist', function () {
    it('Should allow public mint', async function () {
      const [owner, addr1, addr2, addr3, addr4, addr5] =
        await ethers.getSigners();
  
      console.log('Addr 5: ', addr5.address);
  
      const kiftVans = await (
        await ethers.getContractFactory('KiftVans')
      ).deploy(BASE_PREREVEAL_URL);
      await kiftVans.deployed();
  
      await kiftVans.setIsPublicSaleActive(true);
  
      await kiftVans.connect(addr5).mint(1, {
        value: ethers.utils.parseEther('0.12')
      });
  
      balance = await kiftVans.balanceOf(addr5.address);
      expect(balance).to.equal(1);
    });
  });
  