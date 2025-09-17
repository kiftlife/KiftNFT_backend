// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title KiftRedemption
 * @dev Handles the dissolution of Kift DAO by allowing NFT holders to redeem their NFTs for ETH
 * and redistributing unclaimed funds after the claim period ends.
 */
contract KiftRedemption is Ownable, ReentrancyGuard {
    // ============ STATE VARIABLES ============
    
    IERC721 public immutable kiftablesNFT;
    
    uint256 public redemptionStartTime;
    uint256 public constant CLAIM_PERIOD = 30 days;
    uint256 public constant GRACE_PERIOD = 3 days; // Extra time before redistribution
    
    uint256 public totalEthForRedemption;
    uint256 public totalNFTsEligible;
    uint256 public ethPerNFT;
    
    uint256 public totalNFTsRedeemed;
    uint256 public totalEthClaimed;
    
    // Tracking for redistribution phase
    uint256 public redistributionAmount;
    uint256 public redistributionPerNFT;
    bool public redistributionCalculated;
    
    // Excluded addresses (Kift Corp holdings)
    mapping(address => bool) public excludedAddresses;
    
    // Track redemptions
    mapping(uint256 => bool) public redeemedTokens;
    mapping(address => uint256) public userRedemptionCount;
    mapping(address => bool) public hasClaimedRedistribution;
    
    // ============ EVENTS ============
    
    event RedemptionStarted(uint256 startTime, uint256 ethPerNFT, uint256 totalNFTs);
    event NFTRedeemed(address indexed user, uint256 indexed tokenId, uint256 ethAmount);
    event RedistributionCalculated(uint256 totalUnclaimed, uint256 redistributionPerNFT);
    event RedistributionClaimed(address indexed user, uint256 nftCount, uint256 ethAmount);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    
    // ============ MODIFIERS ============
    
    modifier redemptionActive() {
        require(redemptionStartTime > 0, "Redemption not started");
        require(block.timestamp >= redemptionStartTime, "Redemption not yet active");
        require(block.timestamp < redemptionStartTime + CLAIM_PERIOD, "Redemption period ended");
        _;
    }
    
    modifier redemptionEnded() {
        require(redemptionStartTime > 0, "Redemption not started");
        require(block.timestamp >= redemptionStartTime + CLAIM_PERIOD, "Redemption period not ended");
        _;
    }
    
    modifier redistributionActive() {
        require(redistributionCalculated, "Redistribution not calculated");
        require(block.timestamp >= redemptionStartTime + CLAIM_PERIOD + GRACE_PERIOD, "Grace period not ended");
        _;
    }
    
    // ============ CONSTRUCTOR ============
    
    constructor(address _kiftablesNFT) {
        require(_kiftablesNFT != address(0), "Invalid NFT address");
        kiftablesNFT = IERC721(_kiftablesNFT);
    }
    
    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Set excluded addresses (Kift Corp holdings)
     */
    function setExcludedAddresses(address[] calldata _addresses, bool _excluded) external onlyOwner {
        require(redemptionStartTime == 0, "Cannot modify after start");
        for (uint256 i = 0; i < _addresses.length; i++) {
            excludedAddresses[_addresses[i]] = _excluded;
        }
    }
    
    /**
     * @dev Initialize redemption with ETH and calculate per-NFT amount
     * @param _totalNFTsEligible Total NFTs eligible for redemption (excluding Kift Corp)
     */
    function startRedemption(uint256 _totalNFTsEligible) external payable onlyOwner {
        require(redemptionStartTime == 0, "Already started");
        require(msg.value > 0, "No ETH provided");
        require(_totalNFTsEligible > 0, "Invalid NFT count");
        
        redemptionStartTime = block.timestamp;
        totalEthForRedemption = msg.value;
        totalNFTsEligible = _totalNFTsEligible;
        ethPerNFT = msg.value / _totalNFTsEligible;
        
        emit RedemptionStarted(redemptionStartTime, ethPerNFT, _totalNFTsEligible);
    }
    
    /**
     * @dev Calculate redistribution amounts after claim period ends
     */
    function calculateRedistribution() external redemptionEnded {
        require(!redistributionCalculated, "Already calculated");
        
        uint256 unclaimedEth = totalEthForRedemption - totalEthClaimed;
        
        if (totalNFTsRedeemed > 0 && unclaimedEth > 0) {
            redistributionAmount = unclaimedEth;
            redistributionPerNFT = unclaimedEth / totalNFTsRedeemed;
        }
        
        redistributionCalculated = true;
        emit RedistributionCalculated(unclaimedEth, redistributionPerNFT);
    }
    
    // ============ REDEMPTION FUNCTIONS ============
    
    /**
     * @dev Redeem multiple NFTs for ETH
     * @param tokenIds Array of token IDs to redeem
     */
    function redeemNFTs(uint256[] calldata tokenIds) external redemptionActive nonReentrant {
        require(tokenIds.length > 0, "No tokens provided");
        require(!excludedAddresses[msg.sender], "Address excluded");
        
        uint256 totalEth = 0;
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            
            // Verify ownership
            require(kiftablesNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
            require(!redeemedTokens[tokenId], "Already redeemed");
            
            // Mark as redeemed
            redeemedTokens[tokenId] = true;
            
            // Transfer NFT to this contract (for burning)
            kiftablesNFT.transferFrom(msg.sender, address(this), tokenId);
            
            totalEth += ethPerNFT;
            totalNFTsRedeemed++;
            
            emit NFTRedeemed(msg.sender, tokenId, ethPerNFT);
        }
        
        userRedemptionCount[msg.sender] += tokenIds.length;
        totalEthClaimed += totalEth;
        
        // Transfer ETH to user
        (bool success, ) = payable(msg.sender).call{value: totalEth}("");
        require(success, "ETH transfer failed");
    }
    
    /**
     * @dev Claim redistribution for users who redeemed during claim window
     */
    function claimRedistribution() external redistributionActive nonReentrant {
        require(userRedemptionCount[msg.sender] > 0, "No NFTs redeemed");
        require(!hasClaimedRedistribution[msg.sender], "Already claimed");
        
        uint256 redistributionShare = redistributionPerNFT * userRedemptionCount[msg.sender];
        require(redistributionShare > 0, "No redistribution available");
        
        hasClaimedRedistribution[msg.sender] = true;
        
        emit RedistributionClaimed(msg.sender, userRedemptionCount[msg.sender], redistributionShare);
        
        (bool success, ) = payable(msg.sender).call{value: redistributionShare}("");
        require(success, "ETH transfer failed");
    }
    
    // ============ VIEW FUNCTIONS ============
    
    function getRedemptionInfo() external view returns (
        uint256 startTime,
        uint256 endTime,
        uint256 ethPerToken,
        uint256 totalRedeemed,
        uint256 totalUnclaimed
    ) {
        startTime = redemptionStartTime;
        endTime = redemptionStartTime + CLAIM_PERIOD;
        ethPerToken = ethPerNFT;
        totalRedeemed = totalNFTsRedeemed;
        totalUnclaimed = totalEthForRedemption - totalEthClaimed;
    }
    
    function getUserInfo(address user) external view returns (
        uint256 nftsRedeemed,
        bool hasClaimedRedist,
        uint256 redistAmount
    ) {
        nftsRedeemed = userRedemptionCount[user];
        hasClaimedRedist = hasClaimedRedistribution[user];
        redistAmount = redistributionCalculated ? redistributionPerNFT * nftsRedeemed : 0;
    }
    
    function timeUntilRedistribution() external view returns (uint256) {
        if (redemptionStartTime == 0) return type(uint256).max;
        
        uint256 redistTime = redemptionStartTime + CLAIM_PERIOD + GRACE_PERIOD;
        if (block.timestamp >= redistTime) return 0;
        
        return redistTime - block.timestamp;
    }
    
    // ============ EMERGENCY FUNCTIONS ============
    
    /**
     * @dev Emergency withdraw after a long period (6 months) for any stuck funds
     */
    function emergencyWithdraw() external onlyOwner {
        require(redemptionStartTime > 0, "Not started");
        require(block.timestamp > redemptionStartTime + 180 days, "Too early for emergency");
        
        uint256 balance = address(this).balance;
        emit EmergencyWithdraw(msg.sender, balance);
        
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    // ============ RECEIVE FUNCTION ============
    
    receive() external payable {
        // Allow contract to receive ETH
    }
}