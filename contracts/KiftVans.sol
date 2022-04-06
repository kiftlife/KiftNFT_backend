// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "BatchReveal.sol";

contract KiftVans is ERC721, IERC2981, Ownable, ReentrancyGuard, VRFConsumerBase, BatchReveal {
    using Counters for Counters.Counter;

    Counters.Counter private tokenCounter;

    string public baseURI; // ifps root dir
    string private preRevealBaseURI;

    mapping(uint256 => uint256) tokenToMetadata;
    mapping(uint256 => uint256) metadataToToken;
    uint256 public revealRandomness; // populate w/ chainlink
    uint256 public revealedUpTo = 1; // token 0 maps to metadata 0 for simplicity

    uint256 public constant MAX_VANS_PER_WALLET = 5;
    uint256 public maxVans = 10000;
    uint256 public maxCommunitySaleVans = 7000;
    uint256 public maxTreasuryVans = 900;
    uint256 public maxAirdroppedVans = 100;

    uint256 public constant PUBLIC_SALE_PRICE = 0.10 ether;
    bool public isPublicSaleActive;

    uint256 public constant COMMUNITY_SALE_PRICE = 0.08 ether;
    bool public isCommunitySaleActive;

    bytes32 public airdropMerkleRoot;
    bytes32 public communityListMerkleRoot;

    mapping(string => uint8) existingURIs; // not currently implemented
    mapping(address => uint256) public communityMintCounts;
    mapping(address => uint256) public airdropMintCounts;

    // Constants from https://docs.chain.link/docs/vrf-contracts/
    bytes32 immutable private s_keyHash;
    address immutable private linkToken;
    address immutable private linkCoordinator;

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

    constructor(string memory _preRevealURI, bytes32 _s_keyHash, address _linkToken, address _linkCoordinator) 
        ERC721("KiftVans", "KIFT") 
        VRFConsumerBase(_linkCoordinator, _linkToken) {
        
        linkToken = _linkToken;
        linkCoordinator = _linkCoordinator;
        s_keyHash = _s_keyHash;

        setPreRevealUri(_preRevealURI);
        airdropMint();
    }

    // ============ DEV-ONLY MERKLE TESTING ============

    function verify(bytes32[] calldata proof, bytes32 root)
        public
        view
        onlyOwner
        returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        return MerkleProof.verify(proof, root, leaf);
    }

    // ============ Airdrop ============

    function airdropMint() public onlyOwner {
        for (uint256 i = 0; i < maxAirdroppedVans; i++) {
            // using _mint saves $5 ($386 vs $391)
            // TODO use IERC721Receiver to support address(this) instead of msg.sender
            _safeMint(msg.sender, nextTokenId());
        }
    }

    function airdropTransfer(address _to, uint256[] memory _tokenIds)
        public
        onlyOwner
    {
        for (uint256 i = 0; i < _tokenIds.length; i++) {
            safeTransferFrom(msg.sender, _to, _tokenIds[i]);
        }
    }

    // ============ PUBLIC FUNCTIONS FOR MINTING ============

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

    // not used, in favor of airdrop
    // function claim(uint8 numberOfTokens, bytes32[] calldata merkleProof)
    //     external
    //     isValidMerkleProof(merkleProof, airdropMerkleRoot)
    // {
    //     uint256 numAlreadyClaimed = airdropMintCounts[msg.sender];

    //     require(
    //         numAlreadyClaimed + numberOfTokens <= MAX_VANS_PER_WALLET,
    //         "Max vans to mint in community sale is five"
    //     );

    //     require(
    //         tokenCounter.current() + numberOfTokens <= maxCommunitySaleVans,
    //         "Not enough vans remaining to mint"
    //     );

    //     airdropMintCounts[msg.sender] = numAlreadyClaimed + numberOfTokens;

    //     for (uint256 i = 0; i < numberOfTokens; i++) {
    //         _safeMint(msg.sender, nextTokenId());
    //     }
    // }

    // ============ PUBLIC READ-ONLY FUNCTIONS ============

    function getBaseURI() external view returns (string memory) {
        return baseURI;
    }

    function communitySaleLive() external view returns (bool) {
        return isCommunitySaleActive;
    }

    function publicSaleLive() external view returns (bool) {
        return isPublicSaleActive;
    }

    function count() public view returns (uint256) {
        return tokenCounter.current();
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }

    function setPreRevealUri(string memory _uri) public onlyOwner {
        preRevealBaseURI = _uri;
    }

    function reveal() external onlyOwner {
        revealed = true;
    }

    function revealNew() external onlyOwner {
        for (uint256 i = revealedUpTo; i < tokenCounter.current(); i++) {
            uint256 randomMetadataId = 0;
            uint256 nonce = 0;
            while (metadataToToken[randomMetadataId] == 0) {
                while (metadataToToken[
                randomMetadataId = keccak256(abi.encodePacked(revealRandomness, message.sender, i, nonce)) % 10000;
                nonce++;
            }
            tokenToMetadata[i] = randomMetadataId;
            metadataToToken[
        }
        revealedUpTo = tokenCounter.current();
    }

    // DEV testing only. remove for prod
    function toggleReveal(bool _revealed) external onlyOwner {
        revealed = _revealed;
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

    function setAirdropListMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        airdropMerkleRoot = _merkleRoot;
    }

    // TODO currently defaulting back to reverse check using ownerOf(tokenId)
    function isContentOwned(string memory _uri) public view returns (bool) {
        return existingURIs[_uri] == 1;
    }

    function withdraw() public payable onlyOwner {
        (bool success, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(success);
    }

    // ============ CHAINLINK FUNCTIONS ============

    // batchNumber belongs to [0, TOKEN_LIMIT/REVEAL_BATCH_SIZE]
    // if fee is incorrect chainlink's coordinator will just revert the tx so it's good
    function requestRandomSeed(uint s_fee) public returns (bytes32 requestId) {
        require(totalSupply >= (lastTokenRevealed + REVEAL_BATCH_SIZE), "totalSupply too low");

        // checking LINK balance
        require(IERC20(linkToken).balanceOf(address(this)) >= s_fee, "Not enough LINK to pay fee");

        // requesting randomness
        requestId = requestRandomness(s_keyHash, s_fee);
    }

    function fulfillRandomness(bytes32, uint256 randomness) internal override {
        require(totalSupply >= (lastTokenRevealed + REVEAL_BATCH_SIZE), "totalSupply too low");
        setBatchSeed(randomness);
    }

    // ============ SUPPORTING FUNCTIONS ============

    function nextTokenId() private returns (uint256) {
        tokenCounter.increment();
        return tokenCounter.current();
    }

    // ============ FUNCTION OVERRIDES ============
    function _burn(uint256 _tokenId) internal override(ERC721) {
        super._burn(_tokenId);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_exists(_tokenId), "Nonexistent token");

        if (id >= lastTokenRevealed) {
            return preRevealBaseURI;
        }

        return
            string(
                abi.encodePacked(
                    baseURI,
                    "/",
                    getShuffledTokenId(_tokenId).toString(),
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
