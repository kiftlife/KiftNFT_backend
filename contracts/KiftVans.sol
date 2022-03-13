// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

// import "@openzeppelin/contracts/utils/Strings.sol";
// import "@openzeppelin/contracts/interfaces/IERC20.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract KiftVans is ERC721, IERC2981, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter private tokenCounter;

    string private baseURI; // ifps root dir
    // string public verificationHash;

    uint256 public constant MAX_VANS_PER_WALLET = 10;
    uint256 public maxVans = 9999; // the max total number of vans allowed to be minted across all sales
    uint256 public maxCommunitySaleVans = 8888; // the max number of vans the community sale can mint

    uint256 public constant PUBLIC_SALE_PRICE = 0.12 ether;
    bool public isPublicSaleActive;

    uint256 public constant COMMUNITY_SALE_PRICE = 0.1 ether;
    bool public isCommunitySaleActive;

    bytes32 public airdropMerkleRoot;
    bytes32 public communityListMerkleRoot;

    mapping(string => uint8) existingURIs;
    mapping(address => uint256) public communityMintCounts;
    mapping(address => uint256) public airdropMintCounts;

    // ============ ACCESS CONTROL/SANITY MODIFIERS ============

    modifier publicSaleActive() {
        require(isPublicSaleActive, "Public sale is not open");
        _;
    }

    modifier communitySaleActive() {
        require(isCommunitySaleActive, "Community sale is not open");
        _;
    }

    modifier maxVansPerWallet(uint256 numberOfTokens) {
        require(
            balanceOf(msg.sender) + numberOfTokens <= MAX_VANS_PER_WALLET,
            "Max vans to mint is ten"
        );
        _;
    }

    modifier canMintVans(uint256 numberOfTokens) {
        require(
            tokenCounter.current() + numberOfTokens <= maxVans,
            "Not enough vans remaining to mint"
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
            "Address does not exist in list"
        );
        _;
    }

    constructor() ERC721("KiftVans", "KIFT") {}

    // ============ DEV-ONLY WHITELIST TESTING ============

    function verify(bytes32[] calldata proof, bytes32 root)
        public
        view
        returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));

        return MerkleProof.verify(proof, root, leaf);
    }

    // ============ PUBLIC FUNCTIONS FOR MINTING ============

    // where metadataUri = https://pinata.cloud/ifps/Qwdskdfa..../1.json
    function mint(uint256 numberOfTokens)
        public
        payable
        nonReentrant
        isCorrectPayment(PUBLIC_SALE_PRICE, numberOfTokens)
        publicSaleActive
        canMintVans(numberOfTokens)
        maxVansPerWallet(numberOfTokens)
    {
        for (uint256 i = 0; i < numberOfTokens; i++) {
            _safeMint(msg.sender, nextTokenId());
        }

        // uint256 newItemId = tokenCounter.current();
        // tokenCounter.increment();
        // existingURIs[metadataURI] = 1;

        // _mint(recipient, newItemId);
        // _setTokenURI(newItemId, metadataURI);

        // return newItemId;
    }

    function mintCommunitySale(
        uint8 numberOfTokens,
        bytes32[] calldata merkleProof
    )
        external
        payable
        nonReentrant
        communitySaleActive
        canMintVans(numberOfTokens)
        isCorrectPayment(COMMUNITY_SALE_PRICE, numberOfTokens)
        isValidMerkleProof(merkleProof, communityListMerkleRoot)
    {
        uint256 numAlreadyMinted = communityMintCounts[msg.sender];

        require(
            numAlreadyMinted + numberOfTokens <= MAX_VANS_PER_WALLET,
            "Max vans to mint in community sale is ten"
        );

        require(
            tokenCounter.current() + numberOfTokens <= maxCommunitySaleVans,
            "Not enough vans remaining to mint"
        );

        communityMintCounts[msg.sender] = numAlreadyMinted + numberOfTokens;

        for (uint256 i = 0; i < numberOfTokens; i++) {
            _safeMint(msg.sender, nextTokenId());
        }
    }

    function claim(uint8 numberOfTokens, bytes32[] calldata merkleProof)
        external
        isValidMerkleProof(merkleProof, airdropMerkleRoot)
    {
        uint256 numAlreadyClaimed = airdropMintCounts[msg.sender];

        require(
            numAlreadyClaimed + numberOfTokens <= MAX_VANS_PER_WALLET,
            "Max vans to mint in community sale is five"
        );

        require(
            tokenCounter.current() + numberOfTokens <= maxCommunitySaleVans,
            "Not enough vans remaining to mint"
        );

        airdropMintCounts[msg.sender] = numAlreadyClaimed + numberOfTokens;

        for (uint256 i = 0; i < numberOfTokens; i++) {
            _safeMint(msg.sender, nextTokenId());
        }
    }

    // ============ PUBLIC READ-ONLY FUNCTIONS ============

    function getBaseURI() external view returns (string memory) {
        return baseURI;
    }

    function getLastTokenId() external view returns (uint256) {
        return tokenCounter.current();
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
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

    function setCommunityListMerkleRoot(bytes32 merkleRoot) external onlyOwner {
        communityListMerkleRoot = merkleRoot;
    }

    function setAirdropListMerkleRoot(bytes32 merkleRoot) external onlyOwner {
        airdropMerkleRoot = merkleRoot;
    }

    function count() public view returns (uint256) {
        return tokenCounter.current();
    }

    function isContentOwned(string memory uri) public view returns (bool) {
        return existingURIs[uri] == 1;
    }

    // ============ SUPPORTING FUNCTIONS ============

    function nextTokenId() private returns (uint256) {
        tokenCounter.increment();
        return tokenCounter.current();
    }

    // ============ FUNCTION OVERRIDES ============
    function _burn(uint256 tokenId) internal override(ERC721) {
        super._burn(tokenId);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(tokenId), "Nonexistent token");

        return string(abi.encodePacked(baseURI, "/", tokenId, ".json"));
    }

    /**
     * @dev See {IERC165-royaltyInfo}.
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        require(_exists(tokenId), "Nonexistent token");

        return (address(this), SafeMath.div(SafeMath.mul(salePrice, 5), 100));
    }
}
