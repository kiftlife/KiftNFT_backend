# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Kift NFT backend project for managing NFT smart contracts (Kiftables) on Ethereum. The project includes:
- ERC721A-based NFT smart contracts with batch reveal functionality
- Chainlink VRF integration for randomized reveals
- Merkle tree-based allowlist for community sales
- The Graph subgraph for indexing blockchain events

## Core Commands

### Development & Testing
```bash
# Install dependencies
npm install

# Start local Hardhat node
npx hardhat node

# Run specific tests
npx hardhat test test/00_treasury.js
npx hardhat test test/01_airdrop.js
npx hardhat test test/02_community-sale.js
npx hardhat test test/03_public-sale.js
npx hardhat test test/batchReveal.js

# Run all tests
npx hardhat test
```

### Contract Deployment & Interaction
```bash
# Deploy contract
npx hardhat run scripts/00_deploy.js --network [network]

# Verify contract on Etherscan
npx hardhat verify --network [network] CONTRACT_ADDRESS [constructor params]

# Run deployment scripts in order
npx hardhat run scripts/01_setURLs.js --network [network]
npx hardhat run scripts/02_mintTreasury.js --network [network]
npx hardhat run scripts/03_airdrop.js --network [network]
npx hardhat run scripts/04_reveal.js --network [network]
```

### Subgraph Development
```bash
# Navigate to subgraph directory
cd kiftables_subgraph

# Install subgraph dependencies
yarn install

# Generate TypeScript from schema
yarn codegen

# Build subgraph
yarn build

# Deploy to The Graph hosted service
yarn deploy
```

## Architecture

### Smart Contract Structure
- **Main Contract**: `contracts/Kiftables.sol`
  - Extends ERC721A for gas-efficient batch minting
  - Implements VRFConsumerBaseV2 for Chainlink VRF randomness
  - Uses BatchReveal pattern for metadata reveals
  - Maximum supply: 10,000 NFTs (1,000 treasury, 7,000 community sale, rest public)
  - Per-wallet limit: 5 NFTs
  - Pricing: 0.08 ETH (community), 0.1 ETH (public)

- **Supporting Contracts**:
  - `contracts/BatchReveal.sol`: Handles batch reveal logic
  - Mock contracts in `__mocks__/` for testing VRF functionality

### Deployment Scripts Flow
1. `00_deploy.js`: Deploy main contract
2. `01_setURLs.js`: Configure metadata URIs
3. `02_mintTreasury.js`: Mint treasury allocation
4. `03_airdrop.js`: Execute airdrops
5. `04_reveal.js`: Trigger batch reveals
6. `05_setAllowListRootHash.js`: Set merkle root for community sale
7. `05_communitySaleOn.js` / `06_communitySaleOff.js`: Toggle community sale
8. `07_publicSaleOn.js`: Enable public sale

### Subgraph Integration
- Located in `kiftables_subgraph/`
- Indexes Transfer and Reveal events from mainnet contract
- Contract address: `0x228d11Ae974De7f92c16A1F621341759c56D039D`
- Start block: 14885347
- API endpoint: https://thegraph.com/hosted-service/subgraph/bradryan/kiftables

### Environment Variables Required
Create `.env` file with:
- `DEV_PRIVATE_KEY`: Wallet private key for development
- `PROD_PRIVATE_KEY`: Wallet private key for production
- `ALCHEMY_RINKEBY_API_URL`: Rinkeby RPC endpoint
- `INFURA_API_URL`: Mainnet RPC endpoint
- `ETHERSCAN_KEY`: Etherscan API key for verification
- `COINMARKETCAP_KEY`: CoinMarketCap API key for gas reporting

## Key Implementation Details

### Merkle Tree Allowlist
- Community sale uses merkle proof verification
- Set root hash with `scripts/05_setAllowListRootHash.js`
- Helper utilities in `scripts/merkle.js`

### VRF Configuration
- Uses Chainlink VRF V2 for randomness
- Configured per network in deployment scripts
- Mock contracts available for local testing

### Gas Optimization
- ERC721A for efficient batch minting
- Optimizer enabled with 2000 runs
- Gas reporter configured for cost analysis