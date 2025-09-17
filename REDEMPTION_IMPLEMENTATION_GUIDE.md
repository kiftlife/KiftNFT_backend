# Kift DAO Dissolution - Redemption Contract Implementation Guide

## Overview
The `KiftRedemption.sol` contract facilitates the dissolution of Kift DAO by allowing NFT holders to redeem their NFTs for ETH from the treasury, with automatic redistribution of unclaimed funds.

## Contract Architecture

### Key Features
1. **30-Day Claim Window**: NFT holders can redeem during this period
2. **NFT Burning**: Redeemed NFTs are transferred to the contract (effectively burned)
3. **Automatic Redistribution**: Unclaimed ETH redistributed to active participants
4. **Excluded Addresses**: Kift Corp holdings can be excluded from redemption
5. **Emergency Withdrawal**: Owner can recover funds after 6 months

### Contract Flow

```
1. Deploy Contract
   ↓
2. Set Excluded Addresses (Kift Corp wallets)
   ↓
3. Transfer Treasury ETH & Start Redemption
   ↓
4. 30-Day Redemption Period
   ↓
5. Calculate Redistribution
   ↓
6. 3-Day Grace Period
   ↓
7. Redistribution Claims Open
```

## Deployment Process

### Step 1: Pre-Deployment Tasks
```javascript
// 1. Identify total eligible NFTs (excluding Kift Corp)
const totalSupply = 10000;
const kiftCorpHoldings = /* query from contract or subgraph */;
const eligibleNFTs = totalSupply - kiftCorpHoldings;

// 2. Calculate treasury balance to transfer
const treasuryBalance = await provider.getBalance(KIFTABLES_ADDRESS);
```

### Step 2: Deploy Redemption Contract
```javascript
// Deploy script
const KiftRedemption = await ethers.getContractFactory("KiftRedemption");
const redemption = await KiftRedemption.deploy(KIFTABLES_ADDRESS);
await redemption.deployed();
```

### Step 3: Configure Contract
```javascript
// Set excluded addresses (Kift Corp wallets)
const excludedWallets = ["0x...", "0x..."];
await redemption.setExcludedAddresses(excludedWallets, true);

// Transfer ETH from Kiftables contract to Redemption contract
// (Owner must call withdraw() on Kiftables first)
const kiftables = await ethers.getContractAt("Kiftables", KIFTABLES_ADDRESS);
await kiftables.withdraw(); // Withdraws to owner

// Start redemption with treasury ETH
await redemption.startRedemption(eligibleNFTs, {
  value: treasuryBalance
});
```

## UI Requirements

### Essential Components

1. **Landing Page**
   - Redemption status (active/ended/redistribution)
   - Time remaining in current phase
   - Total ETH available / ETH per NFT
   - Statistics (NFTs redeemed, ETH claimed)

2. **Redemption Interface**
   ```typescript
   interface RedemptionUI {
     // Display user's eligible NFTs
     getUserNFTs(): Promise<NFT[]>;
     
     // Show redemption value
     calculateRedemptionValue(nftCount: number): BigNumber;
     
     // Batch redemption
     redeemNFTs(tokenIds: number[]): Promise<Transaction>;
   }
   ```

3. **Redistribution Interface**
   - Check eligibility (redeemed during window)
   - Display redistribution amount
   - Claim button for redistribution

### Frontend Implementation
```javascript
// Example React component structure
function RedemptionDApp() {
  // Phase 1: Active Redemption
  if (isRedemptionActive) {
    return <ActiveRedemption />;
  }
  
  // Phase 2: Redistribution
  if (isRedistributionActive) {
    return <RedistributionClaim />;
  }
  
  // Phase 3: Completed
  return <DissolutionComplete />;
}
```

## Technical Considerations

### 1. NFT Approval Required
Users must approve the redemption contract to transfer their NFTs:
```javascript
// User action required before redemption
await kiftablesNFT.setApprovalForAll(redemptionContract, true);
```

### 2. Gas Optimization
- Batch redemptions save gas vs individual transactions
- Consider implementing a maximum batch size (e.g., 20 NFTs)

### 3. Burn Mechanism
The contract receives NFTs but doesn't truly "burn" them. Options:
- **Current**: NFTs held by contract (effectively removed from circulation)
- **Alternative**: Implement burn function in Kiftables contract (requires upgrade)
- **Best Practice**: Transfer to 0xdead address after receiving

### 4. Tracking & Transparency
```javascript
// Subgraph queries for tracking
query RedemptionStats {
  redemptions(first: 1000) {
    user
    tokenId
    ethAmount
    timestamp
  }
  
  redistributions {
    user
    nftCount
    ethAmount
  }
}
```

## Testing Strategy

### Unit Tests
```javascript
describe("KiftRedemption", () => {
  it("Should calculate correct ETH per NFT");
  it("Should only allow redemption during window");
  it("Should transfer NFTs to contract");
  it("Should distribute ETH correctly");
  it("Should calculate redistribution properly");
  it("Should prevent double redemption");
  it("Should exclude Kift Corp addresses");
});
```

### Integration Tests
1. Deploy on testnet (Goerli/Sepolia)
2. Test with mock NFT contract
3. Verify all phases work correctly
4. Test edge cases (no redemptions, 100% redemptions)

## Alternative Approaches

### Hybrid On-Chain/Off-Chain
**Pros**: Lower gas costs, more flexibility
**Cons**: Less trustless, requires manual intervention

### Snapshot + Merkle Tree
**Pros**: Gas efficient, proven pattern
**Cons**: Requires snapshot coordination, less dynamic

### Current Approach Benefits
✅ Fully on-chain and trustless
✅ Automatic redistribution
✅ No manual intervention needed
✅ Transparent and verifiable
✅ Handles edge cases automatically

## Deployment Checklist

- [ ] Audit redemption contract
- [ ] Deploy contract to mainnet
- [ ] Set excluded addresses
- [ ] Transfer treasury funds
- [ ] Start redemption period
- [ ] Deploy and test UI
- [ ] Announce to community
- [ ] Monitor redemption progress
- [ ] Calculate redistribution after 30 days
- [ ] Archive Discord after completion

## Emergency Procedures

1. **Contract Pause**: Not implemented (consider adding)
2. **Emergency Withdrawal**: Available after 6 months
3. **Owner Controls**: Can only be used before redemption starts

## Gas Estimates

- Deploy contract: ~2M gas
- Start redemption: ~100k gas
- Redeem 1 NFT: ~150k gas
- Redeem 5 NFTs: ~500k gas
- Claim redistribution: ~80k gas

## Security Considerations

1. **Reentrancy Protection**: Already implemented
2. **Integer Overflow**: Using Solidity 0.8.x built-in checks
3. **Access Control**: Owner-only functions protected
4. **Time Manipulation**: Minimal risk with 30-day window
5. **Front-Running**: Not a significant concern for redemptions