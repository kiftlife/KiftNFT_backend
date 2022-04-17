const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL } = require('../config/config');

function generateTokenIdArray(start) {
  return Array.from({ length: 10 }, (_, i) => i + start);
}

async function asyncForEach(array, callback) {
  const res = [];
  for (let index = 0; index < array.length; index++) {
    res.push(await callback(array[index], index, array));
  }
  return res;
}

describe('Airdrop', function () {
  it('Owner should mint airdropped tokens and send to recipients', async function () {
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    const kiftables = await (
      await ethers.getContractFactory('Kiftables')
    ).deploy(BASE_PREREVEAL_URL);

    await kiftables.deployed();
    await kiftables.connect(owner).airdropMint();

    const maxAirdroppedVans = 100;
    const numToAirdrop = 10;

    let ownerBalance = await kiftables.balanceOf(owner.address);
    expect(ownerBalance).to.equal(maxAirdroppedVans);

    const addresses = [addr1, addr2, addr3, addr4, addr5].map((x) => x.address);
    await asyncForEach(addresses, async (address, idx) => {
      const tokenIds = generateTokenIdArray(idx * 10 + 1);
      console.log(`Transfering tokenIds ${tokenIds} to ${address}`);
      await kiftables.connect(owner).airdropTransfer(address, tokenIds);

      const balance = await kiftables.balanceOf(address);
      console.log(`Wallet ${address} balance after transfer: ${balance}`);
      expect(balance).to.equal(numToAirdrop);
    });

    ownerBalance = await kiftables.balanceOf(owner.address);
    expect(ownerBalance).to.equal(
      maxAirdroppedVans - addresses.length * numToAirdrop
    );

  });
});
