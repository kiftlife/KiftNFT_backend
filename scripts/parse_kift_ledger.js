// Paste the user's ledger data here
const ledgerText = `[USER SHOULD PASTE FULL LEDGER HERE]`;

function parseKiftLedger(ledgerData) {
  const lines = ledgerData.trim().split('\n');
  const walletCounts = {};
  let totalMints = 0;

  lines.forEach(line => {
    // Extract all Ethereum addresses from the line
    const addresses = line.match(/0x[a-fA-F0-9]{40}/g);

    if (!addresses || addresses.length < 2) return;

    // First address is typically "From" (0x000...000 for mints)
    // Second address is typically "To" (recipient)
    const fromAddress = addresses[0].toLowerCase();
    const toAddress = addresses[1].toLowerCase();

    // Only count mints (from null address)
    if (fromAddress === '0x0000000000000000000000000000000000000000') {
      walletCounts[toAddress] = (walletCounts[toAddress] || 0) + 1;
      totalMints++;
    }
  });

  return { walletCounts, totalMints };
}

// Manual count based on the provided data
// I'll count from the user's paste
const manualAnalysis = () => {
  // Based on visible data, let me extract unique wallets and count
  const wallets = {};

  // Parsing the ledger manually...
  // Each row with "Mint Community Sale" or "Mint" represents 1 NFT minted

  // This would need the full data, but I can see patterns like:
  // - Some wallets minted 5 NFTs (max per wallet)
  // - Some minted 1-4 NFTs
  // - Both community sale (0.08 ETH) and public sale (0.1 ETH) mints

  console.log('Based on the user statement: ~535 NFTs minted');
  console.log('Need to count unique wallet addresses...\n');
};

manualAnalysis();

module.exports = { parseKiftLedger };
