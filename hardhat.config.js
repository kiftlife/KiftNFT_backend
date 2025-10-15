require('@nomicfoundation/hardhat-ethers');
require('@nomicfoundation/hardhat-chai-matchers');
require('@nomicfoundation/hardhat-verify');
require('hardhat-gas-reporter');
require('hardhat-contract-sizer');
require('dotenv').config();

// Default test private key (DO NOT use in production)
const DEFAULT_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const {
  ALCHEMY_RINKEBY_API_URL = 'https://eth-rinkeby.alchemyapi.io/v2/default',
  DEV_PRIVATE_KEY = DEFAULT_PRIVATE_KEY,
  COINMARKETCAP_KEY = '',
  ETHERSCAN_KEY = '',
  INFURA_API_URL = 'https://mainnet.infura.io/v3/default',
  PROD_PRIVATE_KEY = DEFAULT_PRIVATE_KEY
} = process.env;


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.20',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    artifacts: './src/artifacts'
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
    apiKey: {
      mainnet: ETHERSCAN_KEY,
      sepolia: ETHERSCAN_KEY,
      rinkeby: ETHERSCAN_KEY
    }
  },
  gasReporter: {
    currency: 'USD',
    coinmarketcap: COINMARKETCAP_KEY,
    gasPrice: 50
  }
};
