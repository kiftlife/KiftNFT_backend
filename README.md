# Kift NFT Backend
## Smart Contract and testing

Kift NFT Vans collection powered by a solidity contract running on Mainnet

Testing locally and with polygon mumbai testnet

---
### Dev
To run locally:

1. `npm install`
2. Local wallets: `npx hardhat node`
3. Test Contributor Airdrop: `npx hardhat test airdrop.js`
4. Test Community sale: `npx hardhat test community-sale.js`
5. Test Public sale: `npx hardhat test public-sale.js`
6. Setup your .env file locally:

```
export COINMARKETCAP_KEY=get from coinmarketcap
export DEV_PRIVATE_KEY=contract signer wallet private key
export ALCHEMY_RINKEBY_API_URL=rinkeby alchemy url
export TEST_CONTRACT_ADDRESS=deployed contract wallet
export ALCHEMY_API_KEY=api for using alchemy
```

---
### Deploy & Interact

1. `npx hardhat run scripts/00_deploy.js --network rinkeby`
2. `npx hardhat verify --network rinkeby TEST_CONTRACT_ADDRESS <constructor params>`
3. `npx hardhat run scripts/<step>_interact.js`

^^ run these from the root dir

### Questions?
Message Sante Kotturi on Discord