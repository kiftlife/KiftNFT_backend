const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL , IPFS_BASE_URL} = require('../config/config');

function generateTokenIdArray(start) {
  return Array.from({ length: 10 }, (_, i) => i + start);
}

describe('Reveal', function () {
  it('TokenUrl should change after reveal', async function () {
    const [owner, addr1] = await ethers.getSigners();

    const kiftables = await (
      await ethers.getContractFactory('Kiftables')
    ).deploy(BASE_PREREVEAL_URL);

    await kiftables.deployed();
    await kiftables.connect(owner).airdropMint();
    await kiftables.setBaseURI(IPFS_BASE_URL);

    const maxAirdroppedVans = 100;
    const numToAirdrop = 10;

    let ownerBalance = await kiftables.balanceOf(owner.address);
    expect(ownerBalance).to.equal(maxAirdroppedVans);

    const tokenIds = generateTokenIdArray(1);
    const { address } = addr1;
    console.log(`Transfering tokenIds ${tokenIds} to ${address}`);
    await kiftables.connect(owner).airdropTransfer(address, tokenIds);

    const balance = await kiftables.balanceOf(address);
    console.log(`Wallet ${address} balance after transfer: ${balance}`);
    expect(balance).to.equal(numToAirdrop);

    const firstTokenOwner = await kiftables.ownerOf(1);
    console.log('First token owner: ', firstTokenOwner);
    expect(firstTokenOwner).to.equal(address);

    let revealed = await kiftables.revealed();
    console.log('Revealed? ', revealed)
    expect(revealed).to.equal(false);

    const preRevealUrl = await kiftables.tokenURI(1);
    console.log('Pre-reveal URL: ', preRevealUrl);
    expect(preRevealUrl).to.equal(BASE_PREREVEAL_URL);

    await kiftables.reveal();
    revealed = await kiftables.revealed();
    expect(revealed).to.equal(true);
    console.log('Revealed? ', revealed)

    const revealedUrl = await kiftables.tokenURI(1);
    console.log('Revealed URL: ', revealedUrl);
    expect(revealedUrl).to.equal(`${IPFS_BASE_URL}/1.json`);
  });
});
