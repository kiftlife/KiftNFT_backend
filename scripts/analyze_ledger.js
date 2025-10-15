const fs = require('fs');

// Parse the ledger data
const ledgerData = `0x087f470d65f1a0d7a8d842619d1ee692497a39231e0940a413a19f953c9b187b    Success    ERC-721    Mint Community Sale    14917524    2022-06-06 23:04:59    0x0000000000000000000000000000000000000000    Null: 0x000...000    0x0D83675f7F7F55384Ec4f102D37641E0633B56F1        1    0.08    NFT: Kiftables    0.00896652`;

// Function to extract wallet addresses and count NFTs
function analyzeLedger(data) {
  const lines = data.trim().split('\n');
  const walletCounts = {};

  lines.forEach(line => {
    // Split by tabs or multiple spaces
    const parts = line.split(/\t+|\s{2,}/);

    // The "To" address is typically around index 8-9
    // Looking for addresses starting with 0x that aren't 0x000...000
    const toAddressMatch = line.match(/0x[a-fA-F0-9]{40}/g);

    if (toAddressMatch && toAddressMatch.length >= 2) {
      // Skip the first match (it's often the From address 0x000...000)
      const toAddress = toAddressMatch[1].toLowerCase();

      // Skip null addresses
      if (toAddress === '0x0000000000000000000000000000000000000000') {
        return;
      }

      walletCounts[toAddress] = (walletCounts[toAddress] || 0) + 1;
    }
  });

  return walletCounts;
}

// For now, let's use the sample to show the structure
// User should paste full ledger here
const sampleWallets = {
  '0x0d83675f7f7f55384ec4f102d37641e0633b56f1': 3,
  '0xd66993ca0d24507e9f892e1428dd181b822fdc06': 2,
  // ... etc
};

console.log('Ledger Analysis:');
console.log('================\n');

const uniqueWallets = Object.keys(sampleWallets).length;
const totalNFTs = Object.values(sampleWallets).reduce((sum, count) => sum + count, 0);
const avgNFTsPerWallet = totalNFTs / uniqueWallets;

console.log(`Unique Wallet Addresses: ${uniqueWallets}`);
console.log(`Total NFTs: ${totalNFTs}`);
console.log(`Average NFTs per wallet: ${avgNFTsPerWallet.toFixed(2)}`);

// Distribution breakdown
const distribution = {};
Object.values(sampleWallets).forEach(count => {
  distribution[count] = (distribution[count] || 0) + 1;
});

console.log('\nNFT Distribution:');
console.log('-----------------');
Object.keys(distribution).sort((a, b) => parseInt(a) - parseInt(b)).forEach(nftCount => {
  console.log(`${nftCount} NFT(s): ${distribution[nftCount]} wallets`);
});

module.exports = { analyzeLedger };
