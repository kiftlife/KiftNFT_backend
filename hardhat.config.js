require('@nomiclabs/hardhat-web3');
require('@nomicfoundation/hardhat-chai-matchers');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('dotenv').config();

const {
  ALCHEMY_RINKEBY_API_URL,
  DEV_PRIVATE_KEY,
  COINMARKETCAP_KEY,
  ETHERSCAN_KEY,
  INFURA_API_URL
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
  settings: {
    optimizer: {
      enabled: true,
      runs: 1000,
    },
  },

  networks: {
    hardhat: {
      chainId: 1337
    },
    rinkeby: {
      url: ALCHEMY_RINKEBY_API_URL,
      accounts: [DEV_PRIVATE_KEY]
    },
    mainnet: {
      url: INFURA_API_URL,
      accounts: [PROD_PRIVATE_KEY]
  }
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_KEY,
    gasPrice: 25
  }
};
