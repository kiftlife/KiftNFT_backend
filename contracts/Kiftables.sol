// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "erc721a/contracts/ERC721A.sol";
import "./BatchReveal.sol";

contract Kiftables is
    ERC721A,
    IERC2981,
    Ownable,
    ReentrancyGuard,
    VRFConsumerBaseV2,
    BatchReveal
{
    string public baseURI;
    string public preRevealBaseURI;
    string public verificationHash;
    address private openSeaProxyRegistryAddress;
    bool private isOpenSeaProxyActive = true;

    uint256 public constant MAX_KIFTABLES_PER_WALLET = 5;
    uint256 public constant maxKiftables = 10000;
    uint256 public constant maxCommunitySaleKiftables = 7000;
    uint256 public constant maxTreasuryKiftables = 1000;
    bool public treasuryMinted = false;

    uint256 public constant PUBLIC_SALE_PRICE = 0.1 ether;
    bool public isPublicSaleActive = false;

    uint256 public constant COMMUNITY_SALE_PRICE = 0.08 ether;
    bool public isCommunitySaleActive = false;
    bytes32 public communityListMerkleRoot;
    mapping(address => uint256) public communityMintCounts;
    mapping(address => uint256) public airdropCounts;

    // Constants from https://docs.chain.link/docs/vrf-contracts/
    VRFCoordinatorV2Interface COORDINATOR;
    bytes32 private immutable s_keyHash;
    uint64 private immutable s_subscriptionId;

    // ============ EVENTS ============

    event MintTreasury();
    event Airdrop(address indexed to, uint256 indexed amount);

    // ============ ACCESS CONTROL/SANITY MODIFIERS ============

    modifier publicSaleActive() {
        require(isPublicSaleActive, "Public sale is not active");
        _;
    }

    modifier communitySaleActive() {
        require(isCommunitySaleActive, "Community sale is not active");
        _;
    }

    modifier maxKiftablesPerWallet(uint256 numberOfTokens) {
        uint256 numAirdropped = airdropCounts[msg.sender];
        require(
            numberOfTokens <= 5 &&
                balanceOf(msg.sender) - numAirdropped + numberOfTokens <=
                MAX_KIFTABLES_PER_WALLET,
            "Max Kiftables to mint is five"
        );
        _;
    }

    // TODO check usage of _totalMinted()
    modifier canMintKiftables(uint256 numberOfTokens) {
        require(
            _totalMinted() + numberOfTokens <= maxKiftables,
            "Not enough Kiftables remaining to mint"
        );
        _;
    }

    modifier isCorrectPayment(uint256 price, uint256 numberOfTokens) {
        require(
            price * numberOfTokens == msg.value,
            "Incorrect ETH value sent"
        );
        _;
    }

    modifier isValidMerkleProof(bytes32[] calldata merkleProof, bytes32 root) {
        require(
            MerkleProof.verify(
                merkleProof,
                root,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Address not in list or incorrect proof"
        );
        _;
    }

    constructor(
        string memory _preRevealURI,
        bytes32 _s_keyHash,
        address _vrfCoordinator,
        uint64 _s_subscriptionId,
        address _openSeaProxyRegistryAddress
    ) ERC721A("Kiftables", "KIFT") VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        s_keyHash = _s_keyHash;
        s_subscriptionId = _s_subscriptionId;
        preRevealBaseURI = _preRevealURI;
        openSeaProxyRegistryAddress = _openSeaProxyRegistryAddress;
    }

    // ============ Treasury ============

    // TODO test hardcoding gnosis safe
    function treasuryMint() public onlyOwner {
        require(treasuryMinted == false, "Treasury can only be minted once");
        _safeMint(msg.sender, maxTreasuryKiftables);
        treasuryMinted = true;
        emit MintTreasury();
    }

    // ============ Airdrop ============

    // TODO maybe should be external
    function airdrop(address _to, uint256[] memory _tokenIds) public onlyOwner {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            airdropCounts[_to]++;
            safeTransferFrom(msg.sender, _to, _tokenIds[i]);
        }
        emit Airdrop(_to, _tokenIds.length);
    }

    // ============ PUBLIC FUNCTIONS FOR MINTING ============

    function mint(uint256 numberOfTokens)
        public
        payable
        nonReentrant
        isCorrectPayment(PUBLIC_SALE_PRICE, numberOfTokens)
        publicSaleActive
        canMintKiftables(numberOfTokens)
        maxKiftablesPerWallet(numberOfTokens)
    {
        _safeMint(msg.sender, numberOfTokens);
    }

    function mintCommunitySale(
        uint8 numberOfTokens,
        bytes32[] calldata merkleProof
    )
        external
        payable
        nonReentrant
        communitySaleActive
        canMintKiftables(numberOfTokens)
        isCorrectPayment(COMMUNITY_SALE_PRICE, numberOfTokens)
        isValidMerkleProof(merkleProof, communityListMerkleRoot)
    {
        uint256 numAlreadyMinted = communityMintCounts[msg.sender];

        require(
            numAlreadyMinted + numberOfTokens <= MAX_KIFTABLES_PER_WALLET,
            "Max Kiftables to mint in community sale is five"
        );

        // TODO check usage of _totalMinted()
        require(
            _totalMinted() + numberOfTokens <= maxCommunitySaleKiftables,
            "Not enough Kiftables remaining to mint in community sale"
        );

        communityMintCounts[msg.sender] = numAlreadyMinted + numberOfTokens;

        _safeMint(msg.sender, numberOfTokens);
    }

    // ============ PUBLIC READ-ONLY FUNCTIONS ============

    function nextTokenId() external view returns (uint256) {
        return _totalMinted();
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setPreRevealUri(string memory _uri) external onlyOwner {
        preRevealBaseURI = _uri;
    }

    // Disable gasless listings in case opensea ever shuts down or is compromised
    function setIsOpenSeaProxyActive(bool _isOpenSeaProxyActive)
        external
        onlyOwner
    {
        isOpenSeaProxyActive = _isOpenSeaProxyActive;
    }

    function setIsPublicSaleActive(bool _isPublicSaleActive)
        external
        onlyOwner
    {
        isPublicSaleActive = _isPublicSaleActive;
    }

    function setIsCommunitySaleActive(bool _isCommunitySaleActive)
        external
        onlyOwner
    {
        isCommunitySaleActive = _isCommunitySaleActive;
    }

    function setCommunityListMerkleRoot(bytes32 _merkleRoot)
        external
        onlyOwner
    {
        communityListMerkleRoot = _merkleRoot;
    }

    function setVerificationHash(string memory _verificationHash)
        external
        onlyOwner
    {
        verificationHash = _verificationHash;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    // https://consensys.github.io/smart-contract-best-practices/development-recommendations/general/external-calls/#dont-use-transfer-or-send
    function backupWithdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);
    }

    function withdrawTokens(IERC20 token) public onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        token.transfer(msg.sender, balance);
    }

    // ============ CHAINLINK FUNCTIONS ============

    // batchNumber belongs to [0, TOKEN_LIMIT/REVEAL_BATCH_SIZE]
    function revealNextBatch() public onlyOwner {
        require(
            maxKiftables >= (lastTokenRevealed + REVEAL_BATCH_SIZE),
            "maxKiftables too low"
        );

        // requesting randomness
        COORDINATOR.requestRandomWords(
            s_keyHash,
            s_subscriptionId,
            3, // requestConfirmations
            100000, // callbackGasLimit
            1 // numWords
        );
    }

    function fulfillRandomWords(
        uint256, /* requestId */
        uint256[] memory randomWords
    ) internal override {
        require(
            maxKiftables >= (lastTokenRevealed + REVEAL_BATCH_SIZE),
            "maxKiftables too low"
        );
        setBatchSeed(randomWords[0]);
    }

    // ============ FUNCTION OVERRIDES ============

    /**
     * @dev Override isApprovedForAll to allowlist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator)
        public
        view
        override
        returns (bool)
    {
        // Get a reference to OpenSea's proxy registry contract by instantiating
        // the contract using the already existing address.
        ProxyRegistry proxyRegistry = ProxyRegistry(
            openSeaProxyRegistryAddress
        );
        if (
            isOpenSeaProxyActive &&
            address(proxyRegistry.proxies(owner)) == operator
        ) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override(ERC721A)
        returns (string memory)
    {
        require(_exists(_tokenId), "Nonexistent token");

        if (_tokenId >= lastTokenRevealed) {
            return preRevealBaseURI;
        }

        return
            string(
                abi.encodePacked(
                    baseURI,
                    "/",
                    Strings.toString(getShuffledTokenId(_tokenId)),
                    ".json"
                )
            );
    }

    /**
     * on chain royalties
     * @dev See {IERC165-royaltyInfo}.
     */
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(_tokenId), "Nonexistent token");

        return (address(this), SafeMath.div(SafeMath.mul(_salePrice, 5), 100));
    }
}

// These contract definitions are used to create a reference to the OpenSea
// ProxyRegistry contract by using the registry's address (see isApprovedForAll).
contract OwnableDelegateProxy {

}

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}
