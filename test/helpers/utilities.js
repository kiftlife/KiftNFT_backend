const { ethers } = require('hardhat');
const {
  BASE_PREREVEAL_URL,
  CHAINLINK_KEY_HASH,
  LOCAL_OPENSEA_PROXY
} = require('../../config/config');

const deployAllContracts = async () => {
  const [deployer, gnosisSafe] = await ethers.getSigners();

  const MOCK_SUBSCRIPTION_ID = 0;
  // const MOCK_LINK = constants.AddressZero;        // not needed
  const vrfCoordinatorContract = 'MockVRFCoordinator';

  // deploy
  const kiftContractFactory = await ethers.getContractFactory('Kiftables');
  const vrfCoordFactory = await ethers.getContractFactory(
    vrfCoordinatorContract
  );
  const mockVrfCoordinator = await vrfCoordFactory.connect(deployer).deploy();

  return kiftContractFactory.deploy(
    BASE_PREREVEAL_URL,
    CHAINLINK_KEY_HASH,
    mockVrfCoordinator.address,
    MOCK_SUBSCRIPTION_ID,
    LOCAL_OPENSEA_PROXY,
    gnosisSafe.address
  );
};

const generateTokenIdArray = (start, length) => {
  return Array.from({ length }, (_, i) => i + start);
};

const asyncForEach = async (array, callback) => {
  const res = [];
  for (let index = 0; index < array.length; index++) {
    res.push(await callback(array[index], index, array));
  }
  return res;
};

module.exports = {
  deployAllContracts,
  generateTokenIdArray,
  asyncForEach
};
