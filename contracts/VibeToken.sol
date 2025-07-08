// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract VibeToken is ERC1155, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIds;
    
    struct VibeMetadata {
        string title;
        string description;
        string ipfsHash;
        address creator;
        uint256 createdAt;
        uint256 totalLikes;
        uint256 totalShares;
        bool isActive;
    }
    
    mapping(uint256 => VibeMetadata) public vibeMetadata;
    mapping(uint256 => uint256) public tokenPrices;
    mapping(address => mapping(uint256 => bool)) public hasAccess;
    
    // Fee structure
    uint256 public constant PLATFORM_FEE = 500; // 5%
    uint256 public constant CREATOR_FEE = 1000; // 10%
    uint256 public constant ENGAGEMENT_FEE = 2500; // 25%
    uint256 public constant FEE_DENOMINATOR = 10000;
    
    address public feeRecipient;
    
    event VibeTokenMinted(uint256 indexed tokenId, address indexed creator, string ipfsHash);
    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);
    event EngagementUpdated(uint256 indexed tokenId, uint256 likes, uint256 shares);
    event AccessGranted(address indexed user, uint256 indexed tokenId);
    
    constructor(string memory uri, address _feeRecipient) ERC1155(uri) {
        feeRecipient = _feeRecipient;
    }
    
    function mintVibeToken(
        address to,
        string memory title,
        string memory description,
        string memory ipfsHash,
        uint256 initialPrice
    ) external returns (uint256) {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();
        
        vibeMetadata[newTokenId] = VibeMetadata({
            title: title,
            description: description,
            ipfsHash: ipfsHash,
            creator: to,
            createdAt: block.timestamp,
            totalLikes: 0,
            totalShares: 0,
            isActive: true
        });
        
        tokenPrices[newTokenId] = initialPrice;
        
        _mint(to, newTokenId, 1, "");
        
        emit VibeTokenMinted(newTokenId, to, ipfsHash);
        
        return newTokenId;
    }
    
    function updateEngagement(uint256 tokenId, uint256 likes, uint256 shares) external onlyOwner {
        require(vibeMetadata[tokenId].isActive, "Token not active");
        
        vibeMetadata[tokenId].totalLikes = likes;
        vibeMetadata[tokenId].totalShares = shares;
        
        // Update price based on engagement
        uint256 basePrice = 1 ether; // 1 ZORA base price
        uint256 engagementMultiplier = (likes + shares * 2) / 100; // Each 100 engagement points = 1% increase
        uint256 newPrice = basePrice + (basePrice * engagementMultiplier / 100);
        
        tokenPrices[tokenId] = newPrice;
        
        emit EngagementUpdated(tokenId, likes, shares);
        emit PriceUpdated(tokenId, newPrice);
    }
    
    function purchaseAccess(uint256 tokenId) external payable nonReentrant {
        require(vibeMetadata[tokenId].isActive, "Token not active");
        require(msg.value >= tokenPrices[tokenId] / 10, "Insufficient payment"); // 0.1 token for access
        
        hasAccess[msg.sender][tokenId] = true;
        
        // Distribute fees
        uint256 platformFee = (msg.value * PLATFORM_FEE) / FEE_DENOMINATOR;
        uint256 creatorFee = (msg.value * CREATOR_FEE) / FEE_DENOMINATOR;
        uint256 remaining = msg.value - platformFee - creatorFee;
        
        payable(feeRecipient).transfer(platformFee);
        payable(vibeMetadata[tokenId].creator).transfer(creatorFee);
        
        // Remaining goes to liquidity pool (simplified)
        
        emit AccessGranted(msg.sender, tokenId);
    }
    
    function checkAccess(address user, uint256 tokenId) external view returns (bool) {
        return hasAccess[user][tokenId] || balanceOf(user, tokenId) > 0;
    }
    
    function getVibeMetadata(uint256 tokenId) external view returns (VibeMetadata memory) {
        return vibeMetadata[tokenId];
    }
    
    function getCurrentPrice(uint256 tokenId) external view returns (uint256) {
        return tokenPrices[tokenId];
    }
    
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        feeRecipient = _feeRecipient;
    }
    
    function uri(uint256 tokenId) public view override returns (string memory) {
        return string(abi.encodePacked("https://gateway.pinata.cloud/ipfs/", vibeMetadata[tokenId].ipfsHash));
    }
}
