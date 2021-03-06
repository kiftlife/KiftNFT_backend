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
  INFURA_API_URL,
  PROD_PRIVATE_KEY
} = process.env;


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
      runs: 2000,
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
      accounts: [PROD_PRIVATE_KEY],
      mnemonic: ''
  }
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_KEY,
    gasPrice: 50
  }
};
