// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/**
 * @title KiftRedemption
 * @dev Handles the dissolution of Kift DAO through a three-phase process:
 * 1. Registration Phase (30 days): NFT holders register their NFTs
 * 2. Freeze & Calculate: After 30 days, registration is frozen and ETH per NFT is calculated
 * 3. Airdrop: Contract owner distributes ETH to all registered addresses (contract pays gas)
 */
contract KiftRedemption is Ownable, ReentrancyGuard {
    // ============ STATE VARIABLES ============

    IERC721 public immutable kiftablesNFT;

    uint256 public registrationStartTime;
    uint256 public constant REGISTRATION_PERIOD = 30 days;

    uint256 public totalEthForDistribution;
    uint256 public totalNFTsRegistered;
    uint256 public ethPerRegisteredNFT;
    uint256 public snapshotBalance; // Balance at freeze time (prevents forced-send manipulation)

    bool public registrationFrozen;

    // Excluded addresses (Kift Corp holdings)
    mapping(address => bool) public excludedAddresses;

    // Track registrations
    mapping(uint256 => bool) public registeredTokens;
    mapping(address => uint256) public userRegistrationCount;
    mapping(address => bool) public airdropCompleted;
    mapping(address => uint256) public failedPayout; // Track failed transfers for retry

    // Array to track all addresses that registered for batch airdrop
    address[] public registeredAddresses;
    mapping(address => bool) public addressHasRegistered;
    
    // ============ EVENTS ============

    event RegistrationStarted(uint256 startTime, uint256 totalEth);
    event NFTsRegistered(address indexed user, uint256[] tokenIds, uint256 count);
    event RegistrationFrozen(uint256 totalNFTsRegistered, uint256 ethPerNFT, uint256 totalEth);
    event AirdropProcessed(address indexed user, uint256 nftCount, uint256 ethAmount);
    event AirdropFailed(address indexed user, uint256 amount);
    event ExcessSwept(address indexed to, uint256 amount);
    event EmergencyWithdraw(address indexed to, uint256 amount);
    
    // ============ MODIFIERS ============

    modifier registrationActive() {
        require(registrationStartTime > 0, "Registration not started");
        require(!registrationFrozen, "Registration is frozen");
        require(block.timestamp >= registrationStartTime, "Registration not yet active");
        require(block.timestamp < registrationStartTime + REGISTRATION_PERIOD, "Registration period ended");
        _;
    }

    modifier registrationEnded() {
        require(registrationStartTime > 0, "Registration not started");
        require(block.timestamp >= registrationStartTime + REGISTRATION_PERIOD, "Registration period not ended");
        _;
    }

    modifier onlyWhenFrozen() {
        require(registrationFrozen, "Registration not frozen yet");
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
        require(registrationStartTime == 0, "Cannot modify after start");
        for (uint256 i = 0; i < _addresses.length; i++) {
            excludedAddresses[_addresses[i]] = _excluded;
        }
    }
    
    /**
     * @dev Initialize registration period with ETH for distribution
     */
    function startRegistration() external payable onlyOwner {
        require(registrationStartTime == 0, "Already started");
        require(msg.value > 0, "No ETH provided");

        registrationStartTime = block.timestamp;
        totalEthForDistribution = msg.value;

        emit RegistrationStarted(registrationStartTime, msg.value);
    }
    
    /**
     * @dev Freeze registration and calculate ETH distribution after registration period ends
     * Uses balance snapshot to prevent forced-send ETH from affecting distribution
     */
    function freezeRegistration() external onlyOwner registrationEnded {
        require(!registrationFrozen, "Already frozen");
        require(totalNFTsRegistered > 0, "No NFTs registered");

        registrationFrozen = true;

        // Snapshot balance at freeze time to prevent forced-send manipulation
        snapshotBalance = address(this).balance;
        ethPerRegisteredNFT = snapshotBalance / totalNFTsRegistered;

        emit RegistrationFrozen(totalNFTsRegistered, ethPerRegisteredNFT, snapshotBalance);
    }
    
    // ============ REGISTRATION FUNCTIONS ============

    /**
     * @dev Register NFTs for dissolution distribution
     * @param tokenIds Array of token IDs to register
     */
    function registerNFTs(uint256[] calldata tokenIds) external registrationActive nonReentrant {
        require(tokenIds.length > 0, "No tokens provided");
        require(!excludedAddresses[msg.sender], "Address excluded");

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];

            // Verify ownership
            require(kiftablesNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
            require(!registeredTokens[tokenId], "Already registered");

            // Mark as registered
            registeredTokens[tokenId] = true;
        }

        // Add address to registered addresses array if first time
        if (!addressHasRegistered[msg.sender]) {
            registeredAddresses.push(msg.sender);
            addressHasRegistered[msg.sender] = true;
        }

        // Update counts
        userRegistrationCount[msg.sender] += tokenIds.length;
        totalNFTsRegistered += tokenIds.length;

        emit NFTsRegistered(msg.sender, tokenIds, tokenIds.length);
    }
    
    /**
     * @dev Process airdrop to registered users in batches (non-reverting on failures)
     * @param startIndex Starting index in registeredAddresses array
     * @param endIndex Ending index in registeredAddresses array (exclusive)
     */
    function processAirdrop(uint256 startIndex, uint256 endIndex) external onlyOwner onlyWhenFrozen nonReentrant {
        require(startIndex < endIndex, "Invalid indices");
        require(endIndex <= registeredAddresses.length, "End index out of bounds");

        for (uint256 i = startIndex; i < endIndex; i++) {
            address user = registeredAddresses[i];

            // Skip if already airdropped
            if (airdropCompleted[user]) {
                continue;
            }

            uint256 registrationCount = userRegistrationCount[user];
            if (registrationCount == 0) {
                airdropCompleted[user] = true;
                continue;
            }

            uint256 airdropAmount = ethPerRegisteredNFT * registrationCount;

            // Send ETH (contract pays gas) - non-reverting on failure
            (bool success, ) = payable(user).call{value: airdropAmount}("");

            if (success) {
                // Mark as completed on success
                airdropCompleted[user] = true;
                emit AirdropProcessed(user, registrationCount, airdropAmount);
            } else {
                // Track failure for manual retry - do NOT revert
                failedPayout[user] = airdropAmount;
                emit AirdropFailed(user, airdropAmount);
            }
        }
    }

    /**
     * @dev Retry a failed airdrop for a specific address
     * @param user Address to retry payment for
     */
    function retryFailedAirdrop(address user) external onlyOwner onlyWhenFrozen nonReentrant {
        uint256 amount = failedPayout[user];
        require(amount > 0, "No failed payout for this address");

        // Clear the failed payout before attempting transfer
        failedPayout[user] = 0;

        // Attempt transfer
        (bool success, ) = payable(user).call{value: amount}("");

        if (success) {
            airdropCompleted[user] = true;
            uint256 nftCount = userRegistrationCount[user];
            emit AirdropProcessed(user, nftCount, amount);
        } else {
            // Still failed, restore the failed payout
            failedPayout[user] = amount;
            emit AirdropFailed(user, amount);
        }
    }

    /**
     * @dev Permissionless claim for users with failed airdrops
     * Eliminates liveness dependency on owner/multisig
     */
    function claimFailed() external nonReentrant onlyWhenFrozen {
        uint256 amount = failedPayout[msg.sender];
        require(amount > 0, "No failed payout to claim");

        // Clear the failed payout before transfer (checks-effects-interactions)
        failedPayout[msg.sender] = 0;

        // Attempt transfer
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Claim transfer failed");

        // Mark as completed
        airdropCompleted[msg.sender] = true;

        uint256 nftCount = userRegistrationCount[msg.sender];
        emit AirdropProcessed(msg.sender, nftCount, amount);
    }

    // ============ VIEW FUNCTIONS ============

    function getRegistrationInfo() external view returns (
        uint256 startTime,
        uint256 endTime,
        uint256 totalRegistered,
        uint256 ethPerToken,
        bool isFrozen,
        uint256 totalAddresses
    ) {
        startTime = registrationStartTime;
        endTime = registrationStartTime + REGISTRATION_PERIOD;
        totalRegistered = totalNFTsRegistered;
        ethPerToken = ethPerRegisteredNFT;
        isFrozen = registrationFrozen;
        totalAddresses = registeredAddresses.length;
    }

    function getUserInfo(address user) external view returns (
        uint256 nftsRegistered,
        bool hasReceivedAirdrop,
        uint256 airdropAmount
    ) {
        nftsRegistered = userRegistrationCount[user];
        hasReceivedAirdrop = airdropCompleted[user];
        airdropAmount = registrationFrozen ? ethPerRegisteredNFT * nftsRegistered : 0;
    }

    function timeUntilRegistrationEnd() external view returns (uint256) {
        if (registrationStartTime == 0) return type(uint256).max;

        uint256 endTime = registrationStartTime + REGISTRATION_PERIOD;
        if (block.timestamp >= endTime) return 0;

        return endTime - block.timestamp;
    }

    function getTotalRegisteredAddresses() external view returns (uint256) {
        return registeredAddresses.length;
    }

    function getRegisteredAddress(uint256 index) external view returns (address) {
        require(index < registeredAddresses.length, "Index out of bounds");
        return registeredAddresses[index];
    }
    
    // ============ ADMIN SWEEP FUNCTIONS ============

    /**
     * @dev Sweep excess ETH (dust from division + any forced-send ETH) to treasury
     * @param treasury Address to receive excess funds (typically multisig/DAO)
     * Can only be called after registration is frozen
     */
    function sweepExcess(address payable treasury) external onlyOwner onlyWhenFrozen {
        require(treasury != address(0), "Invalid treasury address");

        uint256 excessBalance = address(this).balance;
        require(excessBalance > 0, "No excess to sweep");

        emit ExcessSwept(treasury, excessBalance);

        (bool success, ) = treasury.call{value: excessBalance}("");
        require(success, "Sweep transfer failed");
    }

    // ============ EMERGENCY FUNCTIONS ============

    /**
     * @dev Emergency withdraw after a long period (6 months) for any stuck funds
     */
    function emergencyWithdraw() external onlyOwner {
        require(registrationStartTime > 0, "Not started");
        require(block.timestamp > registrationStartTime + 180 days, "Too early for emergency");

        uint256 balance = address(this).balance;
        emit EmergencyWithdraw(msg.sender, balance);

        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Transfer failed");
    }
    
    // ============ RECEIVE FUNCTION ============

    receive() external payable {
        // Reject ETH deposits after registration is frozen to prevent fund manipulation
        require(!registrationFrozen, "No deposits after freeze");
    }
}