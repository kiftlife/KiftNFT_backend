const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL, CHAINLINK_KEY_HASH } = require('../config/config');
const { constants } = ethers;

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

describe('BatchReveal', async () => {
  it('Successfully batch reveal 10000 tokens', async () => {
    // setup
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();
    const MOCK_SUBSCRIPTION_ID = 0;
    // const MOCK_LINK = constants.AddressZero;        // not needed
    const vrfCoordinatorContract = 'MockVRFCoordinator';

    // deploy
    const kiftContractFactory = await ethers.getContractFactory('Kiftables');
    const vrfCoordFactory = await ethers.getContractFactory(
      vrfCoordinatorContract
    );
    const mockVrfCoordinator = await vrfCoordFactory.connect(owner).deploy();

    const kiftContract = await kiftContractFactory
      .connect(owner)
      .deploy(
        BASE_PREREVEAL_URL,
        CHAINLINK_KEY_HASH,
        mockVrfCoordinator.address,
        MOCK_SUBSCRIPTION_ID
      );

    console.log(
      'Mock VRF Coordinator Deployed at: ',
      mockVrfCoordinator.address
    );
    console.log('KiftContract: ', kiftContract.address);
    // end deploy

    // check airdrop
    const maxAirdroppedVans = 100;
    const numToAirdrop = 10;

    let ownerBalance = await kiftContract.balanceOf(owner.address);
    expect(ownerBalance).to.equal(maxAirdroppedVans);

    const addresses = [addr1, addr2, addr3, addr4, addr5].map((x) => x.address);
    await asyncForEach(addresses, async (address, idx) => {
      const tokenIds = generateTokenIdArray(idx * 10 + 1);
      console.log(`Transfering tokenIds ${tokenIds} to ${address}`);
      await kiftContract.connect(owner).airdropTransfer(address, tokenIds);

      const balance = await kiftContract.balanceOf(address);
      console.log(`Wallet ${address} balance after transfer: ${balance}`);
      expect(balance).to.equal(numToAirdrop);
    });

    ownerBalance = await kiftContract.balanceOf(owner.address);
    expect(ownerBalance).to.equal(
      maxAirdroppedVans - addresses.length * numToAirdrop
    );

    // TODO confirm metadata uri is still not revealed
    // end airdrop

    
    // TODO mint next 900 tokens triggering a batch
    // TODO confirm metadata uri is revealed for token 1-1000;
    // TODO mint all the way up to 10000 and confirm not overflows/offset issues
    
  });
});
