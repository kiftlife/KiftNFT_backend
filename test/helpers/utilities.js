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
    mockVrfCoordinator.target,
    MOCK_SUBSCRIPTION_ID,
    LOCAL_OPENSEA_PROXY,
    gnosisSafe.address
  );
};

const deployKiftRedemption = async (kiftablesAddress, ethAmount) => {
  const [deployer] = await ethers.getSigners();
  const KiftRedemption = await ethers.getContractFactory('KiftRedemption');

  const redemption = await KiftRedemption.connect(deployer).deploy(kiftablesAddress);

  // Start registration with ETH
  if (ethAmount) {
    await redemption.connect(deployer).startRegistration({ value: ethAmount });
  }

  return redemption;
};

const setupNFTHolders = async (kiftables, wallets, tokenCounts) => {
  const [deployer, gnosisSafe] = await ethers.getSigners();

  // Mint treasury first
  await kiftables.connect(deployer).treasuryMint();

  // Transfer ownership to gnosis safe
  await kiftables.connect(deployer).transferOwnership(gnosisSafe.address);

  let currentTokenId = 0;
  const walletTokenIds = [];

  for (let i = 0; i < wallets.length; i++) {
    const tokenIds = generateTokenIdArray(currentTokenId, tokenCounts[i]);
    await kiftables.connect(gnosisSafe).airdrop(wallets[i].address, tokenIds);
    walletTokenIds.push(tokenIds);
    currentTokenId += tokenCounts[i];
  }

  return walletTokenIds;
};

const calculateExpectedDistribution = (totalEth, nftCounts) => {
  const totalNFTs = nftCounts.reduce((sum, count) => sum + count, 0);
  const ethPerNFT = totalEth / BigInt(totalNFTs);

  return {
    ethPerNFT,
    distributions: nftCounts.map(count => ethPerNFT * BigInt(count)),
    totalNFTs
  };
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
  deployKiftRedemption,
  setupNFTHolders,
  calculateExpectedDistribution,
  generateTokenIdArray,
  asyncForEach
};
