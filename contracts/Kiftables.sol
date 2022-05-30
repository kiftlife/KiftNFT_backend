// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
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
    event WithdrawBalance(address indexed from, uint256 amount);

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
        uint64 _s_subscriptionId
    ) ERC721A("Kiftables", "KIFT") VRFConsumerBaseV2(_vrfCoordinator) {
        COORDINATOR = VRFCoordinatorV2Interface(_vrfCoordinator);
        s_keyHash = _s_keyHash;
        s_subscriptionId = _s_subscriptionId;
        setPreRevealUri(_preRevealURI);
    }

    // ============ DEV-ONLY TESTING ============

    function verify(bytes32[] calldata proof, bytes32 root)
        public
        view
        returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        return MerkleProof.verify(proof, root, leaf);
    }

    // ============ Treasury ============

    function treasuryMint() public onlyOwner {
        require(treasuryMinted == false, "Treasury can only be minted once");
        _safeMint(msg.sender, maxTreasuryKiftables);
        treasuryMinted = true;
        emit MintTreasury();
    }

    // ============ Airdrop ============

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

    // TODO could be put back to uint8
    function mintCommunitySale(
        uint256 numberOfTokens,
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

        require(
            _totalMinted() + numberOfTokens <= maxCommunitySaleKiftables,
            "Not enough Kiftables remaining to mint in community sale"
        );

        communityMintCounts[msg.sender] = numAlreadyMinted + numberOfTokens;

        _safeMint(msg.sender, numberOfTokens);
    }

    // ============ PUBLIC READ-ONLY FUNCTIONS ============

    function counter() public view returns (uint256) {
        return _currentIndex;
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setPreRevealUri(string memory _uri) public onlyOwner {
        preRevealBaseURI = _uri;
    }

    // function to disable gasless listings for security in case
    // opensea ever shuts down or is compromised
    // function setIsOpenSeaProxyActive(bool _isOpenSeaProxyActive)
    //     external
    //     onlyOwner
    // {
    //     isOpenSeaProxyActive = _isOpenSeaProxyActive;
    // }

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

    function withdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);

        emit WithdrawBalance(msg.sender, address(this).balance);
    }

    // ============ CHAINLINK FUNCTIONS ============

    // TODO leave as onlyOwner or set back to public?
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
            100000, // callbackGasLimit         // set back to 100000
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
