const { expect } = require('chai');
const { ethers } = require('hardhat');
const { BASE_PREREVEAL_URL, CHAINLINK_KEY_HASH } = require('../config/config');

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

    // confirm metadata isnt revealed yet
    const firstTen = generateTokenIdArray(1);
    await asyncForEach(firstTen, async (id, idx) => {
      let uri = await kiftContract.tokenURI(id);
      console.log(`Uri for :: ${id} :: ${uri}`);
    });

    // end airdrop

    // 100 tokens minted in constructor. Mint another 801 so we're at 901
    // 1 batch of 900
    // 1 over into second, un-revealed batch
    const tokenCount = 900

    const amount = (0.10 * tokenCount).toString();
    console.log('Amount: ', amount)
    await kiftContract.setIsPublicSaleActive(true);
    await kiftContract.connect(addr1).mint(tokenCount, {
      value: ethers.utils.parseEther(amount)
    });

    balance = await kiftContract.balanceOf(addr1.address);
    console.log('Addr1 bal: ', balance.toString());

    const tx = await kiftContract.revealNextBatch();
    await tx.wait();

    let seed = await kiftContract.getSeedForBatch(1)
    console.log('Seed: ', seed.toString())
    // TODO figure out why this never gets populated....

    // 1,2,3,899,900 should return a shuffled ID, 901 should not
    await asyncForEach([1,2,3], async (id, idx) => {
        let uri = await kiftContract.tokenURI(id);
        console.log(`Uri for :: ${id} :: ${uri}`);
      });

    // TODO confirm metadata uri is revealed for token 1-1000;
    // TODO mint all the way up to 10000 and confirm not overflows/offset issues
  });
});
