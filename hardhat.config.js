require('@nomiclabs/hardhat-waffle');
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-gas-reporter');
require('dotenv').config();

const {
  ALCHEMY_POLYGON_API_URL,
  ALCHEMY_RINKEBY_API_URL,
  PRIVATE_KEY,
  COINMARKETCAP_KEY,
  ETHERSCAN_KEY
} = process.env;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: '0.8.4',
  paths: {
    artifacts: './src/artifacts'
  },
  networks: {
    hardhat: {
      chainId: 1337
    },
    rinkeby: {
      url: ALCHEMY_RINKEBY_API_URL,
      accounts: [PRIVATE_KEY]
    },
    // polygon_mumbai: {
    //   url: ALCHEMY_POLYGON_API_URL,
    //   accounts: [PRIVATE_KEY]
    // }
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_KEY,
    gasPrice: 50
  }
};
