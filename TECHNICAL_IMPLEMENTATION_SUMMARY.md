# Technical Implementation Summary - Kift DAO Dissolution

## 1. New Contract Deployment

### Contract: `KiftRedemption.sol`

**Constructor Parameters:**
- `address _kiftablesNFT`: Address of the existing Kiftables NFT contract (0x228d11ae974de7f92c16a1f621341759c56d039d)

### Key Methods

**Admin Functions (Owner Only):**
- `setExcludedAddresses(address[], bool)` - Mark Kift Corp wallets as ineligible
- `startRedemption(uint256)` - Initialize redemption period with treasury ETH
- `emergencyWithdraw()` - Recover funds after 6 months (safety mechanism)

**User Functions:**
- `redeemNFTs(uint256[])` - Exchange NFTs for ETH during 30-day window
- `claimRedistribution()` - Claim bonus ETH after redistribution calculation

**Public Functions:**
- `calculateRedistribution()` - Compute redistribution amounts (callable by anyone after 30 days)

**View Functions:**
- `getRedemptionInfo()` - Returns current redemption statistics
- `getUserInfo(address)` - Returns user-specific redemption data
- `timeUntilRedistribution()` - Returns seconds until redistribution phase

## 2. Treasury Balance Transfer

### Process:
1. **Multisig calls** on existing Kiftables contract:
   ```solidity
   Kiftables.withdraw()  // Withdraws all ETH to multisig wallet
   ```

2. **Multisig transfers** ETH to new redemption contract via:
   ```solidity
   KiftRedemption.startRedemption{value: treasuryBalance}(eligibleNFTCount)
   ```

### Required Information:
- Current treasury balance: 44.5 ETH
- Eligible NFT count: ~400 (total sold minus Kift Corp holdings)

## 3. 30-Day Period Trigger

The 30-day countdown **starts automatically** when multisig calls:
```solidity
startRedemption(uint256 _totalNFTsEligible)
```

This single transaction:
- Transfers treasury ETH to redemption contract
- Sets `redemptionStartTime = block.timestamp`
- Calculates `ethPerNFT = msg.value / _totalNFTsEligible`
- Emits `RedemptionStarted` event

## 4. After 30 Days

### Day 30-33: Calculation & Grace Period
- **Anyone can call** `calculateRedistribution()`
- Computes: `unclaimedETH ÷ totalNFTsRedeemed`
- Sets redistribution rate per NFT
- 3-day grace period before claims open

### Day 33+: Redistribution Phase
- Users who redeemed can call `claimRedistribution()`
- One-time bonus claim per wallet
- Amount based on NFTs they redeemed

## 5. User Redemption Process (Website Requirements)

### User Interface Needs:

**Phase 1 - Redemption (Day 0-30):**
1. Connect wallet (MetaMask, WalletConnect)
2. Display user's Kiftables NFTs
3. Select NFTs to redeem (checkbox interface)
4. Two-step process:
   - Approve NFT transfer to redemption contract
   - Execute redemption transaction
5. Show immediate ETH payout amount

**Phase 2 - Redistribution (Day 33+):**
1. Check eligibility (did user redeem?)
2. Display claimable bonus amount
3. One-click claim button
4. Show transaction confirmation

### Required Web3 Interactions:
```javascript
// Check NFT ownership
kiftablesContract.balanceOf(userAddress)
kiftablesContract.tokenOfOwnerByIndex(userAddress, index)

// Approve transfer
kiftablesContract.setApprovalForAll(redemptionAddress, true)

// Redeem NFTs
redemptionContract.redeemNFTs([tokenId1, tokenId2, ...])

// Claim redistribution
redemptionContract.claimRedistribution()
```

## 6. Multisig Wallet Actions

### Pre-Launch Actions:
1. **Deploy** KiftRedemption contract
2. **Set excluded addresses** (Kift Corp wallets):
   ```solidity
   setExcludedAddresses([address1, address2, ...], true)
   ```
3. **CRITICAL: Disable all minting** to prevent dilution attacks:
   ```solidity
   Kiftables.setIsPublicSaleActive(false)
   Kiftables.setIsCommunitySaleActive(false)
   ```
   ⚠️ **Must be done BEFORE starting redemption to prevent minting new NFTs for profit**

### Launch Actions:
4. **Withdraw treasury** from Kiftables contract:
   ```solidity
   Kiftables.withdraw()  // Sends ETH to multisig
   ```

5. **Start redemption** with treasury funds:
   ```solidity
   KiftRedemption.startRedemption{value: 44.5 ether}(400)
   ```

### Post-Launch Actions:
- No required actions during redemption period
- Optional: Call `calculateRedistribution()` after 30 days if no one else does
- Emergency only: `emergencyWithdraw()` available after 180 days

## Timeline Summary

```
Day -1: Deploy contract, set exclusions
Day 0:  Multisig starts redemption (triggers 30-day countdown)
Day 1-30: Users redeem NFTs
Day 30: Anyone calls calculateRedistribution()
Day 30-33: Grace period
Day 33+: Users claim redistribution bonus
Day 180+: Emergency withdrawal available (if needed)
```

## Smart Contract Events (for monitoring)

```solidity
event RedemptionStarted(uint256 startTime, uint256 ethPerNFT, uint256 totalNFTs)
event NFTRedeemed(address user, uint256 tokenId, uint256 ethAmount)
event RedistributionCalculated(uint256 totalUnclaimed, uint256 redistributionPerNFT)
event RedistributionClaimed(address user, uint256 nftCount, uint256 ethAmount)
```

## Security Considerations

- Contract uses OpenZeppelin's `ReentrancyGuard`
- NFTs transferred to contract cannot be recovered (effective burn)
- Only original NFT redeemers eligible for redistribution
- Each wallet can only claim redistribution once
- Emergency withdrawal requires 6-month waiting period