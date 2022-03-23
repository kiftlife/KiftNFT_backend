const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL , IPFS_BASE_URL} = require('../config/config');

function generateTokenIdArray(start) {
  return Array.from({ length: 10 }, (_, i) => i + start);
}

describe('Reveal', function () {
  it('TokenUrl should change after reveal', async function () {
    const [owner, addr1] = await ethers.getSigners();

    const kiftVans = await (
      await ethers.getContractFactory('KiftVans')
    ).deploy(BASE_PREREVEAL_URL);

    await kiftVans.deployed();
    await kiftVans.connect(owner).airdropMint();
    await kiftVans.setBaseURI(IPFS_BASE_URL);

    const maxAirdroppedVans = 100;
    const numToAirdrop = 10;

    let ownerBalance = await kiftVans.balanceOf(owner.address);
    expect(ownerBalance).to.equal(maxAirdroppedVans);

    const tokenIds = generateTokenIdArray(1);
    const { address } = addr1;
    console.log(`Transfering tokenIds ${tokenIds} to ${address}`);
    await kiftVans.connect(owner).airdropTransfer(address, tokenIds);

    const balance = await kiftVans.balanceOf(address);
    console.log(`Wallet ${address} balance after transfer: ${balance}`);
    expect(balance).to.equal(numToAirdrop);

    const firstTokenOwner = await kiftVans.ownerOf(1);
    console.log('First token owner: ', firstTokenOwner);
    expect(firstTokenOwner).to.equal(address);

    let revealed = await kiftVans.revealed();
    console.log('Revealed? ', revealed)
    expect(revealed).to.equal(false);

    const preRevealUrl = await kiftVans.tokenURI(1);
    console.log('Pre-reveal URL: ', preRevealUrl);
    expect(preRevealUrl).to.equal(BASE_PREREVEAL_URL);

    await kiftVans.reveal();
    revealed = await kiftVans.revealed();
    expect(revealed).to.equal(true);
    console.log('Revealed? ', revealed)

    const revealedUrl = await kiftVans.tokenURI(1);
    console.log('Revealed URL: ', revealedUrl);
    expect(revealedUrl).to.equal(`${IPFS_BASE_URL}/1.json`);
  });
});
