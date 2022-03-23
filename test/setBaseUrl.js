const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL, IPFS_BASE_URL } = require('../config/config');

describe('Public Whitelist', function () {
  it('Should allow public mint', async function () {
    const kiftVans = await (
      await ethers.getContractFactory('KiftVans')
    ).deploy(BASE_PREREVEAL_URL);

    const tx1 = await kiftVans.setBaseURI(IPFS_BASE_URL);
    const result = await kiftVans.getBaseURI();
    console.log('Base url set to: ', result);
  });
});
