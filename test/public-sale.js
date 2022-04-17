
const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');

  describe('Public Whitelist', function () {
    it('Should allow public mint', async function () {
      const [owner, addr1, addr2, addr3, addr4, addr5] =
        await ethers.getSigners();
  
      console.log('Addr 5: ', addr5.address);
  
      const kiftables = await (
        await ethers.getContractFactory('Kiftables')
      ).deploy(BASE_PREREVEAL_URL);
      await kiftables.deployed();
  
      await kiftables.setIsPublicSaleActive(true);
  
      await kiftables.connect(addr5).mint(1, {
        value: ethers.utils.parseEther('0.12')
      });
  
      balance = await kiftables.balanceOf(addr5.address);
      expect(balance).to.equal(1);
    });
  });
  