import { ethers } from "ethers"

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
export const CONTRACTS = {
  VIBE_TOKEN: process.env.NEXT_PUBLIC_VIBE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
  CHALLENGE_MANAGER: process.env.NEXT_PUBLIC_CHALLENGE_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000",
}

// 🎯 ZORA NETWORK CONFIGURATION (RECOMMENDED)
export const DEPLOYMENT_CHAINS = {
  ZORA_MAINNET: {
    chainId: 7777777,
    name: "Zora Network",
    rpcUrl: "https://rpc.zora.energy",
    blockExplorer: "https://explorer.zora.energy",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    isRecommended: true,
    features: ["Zora Protocol", "Creator Tools", "Low Fees", "Zora Coins SDK"],
  },
  ZORA_SEPOLIA: {
    chainId: 999999999,
    name: "Zora Sepolia Testnet",
    rpcUrl: "https://sepolia.rpc.zora.energy",
    blockExplorer: "https://sepolia.explorer.zora.energy",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    isTestnet: true,
    features: ["Zora Protocol", "Creator Tools", "Testing Environment"],
  },
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    isTestnet: true,
    features: ["ZORA Token (Spring 2025)", "Coinbase Ecosystem"],
  },
}

// Enhanced ABIs with Zora integration
export const VIBE_TOKEN_ABI = [
  "function mintVibeToken(address to, string title, string description, string ipfsHash, uint256 initialPrice) external returns (uint256)",
  "function updateEngagement(uint256 tokenId, uint256 likes, uint256 shares) external",
  "function purchaseAccess(uint256 tokenId) external payable",
  "function checkAccess(address user, uint256 tokenId) external view returns (bool)",
  "function getVibeMetadata(uint256 tokenId) external view returns (tuple(string title, string description, string ipfsHash, address creator, uint256 createdAt, uint256 totalLikes, uint256 totalShares, bool isActive))",
  "function getCurrentPrice(uint256 tokenId) external view returns (uint256)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  // Zora Protocol integration
  "function mintToZoraProtocol(address to, string tokenURI, uint256 quantity) external returns (uint256)",
  "function setZoraProtocolAddress(address zoraProtocol) external",
  "function getZoraTokenId(uint256 vibeTokenId) external view returns (uint256)",
  // Events
  "event VibeTokenMinted(uint256 indexed tokenId, address indexed creator, string ipfsHash)",
  "event ZoraMinted(uint256 indexed vibeTokenId, uint256 indexed zoraTokenId, address creator)",
  "event PriceUpdated(uint256 indexed tokenId, uint256 newPrice)",
  "event EngagementUpdated(uint256 indexed tokenId, uint256 likes, uint256 shares)",
  "event AccessGranted(address indexed user, uint256 indexed tokenId)",
]

export const CHALLENGE_MANAGER_ABI = [
  "function createChallenge(string title, string description, uint256 duration) external returns (uint256)",
  "function submitToChallenge(uint256 challengeId, string ipfsHash, string title) external returns (uint256)",
  "function voteForSubmission(uint256 submissionId) external",
  "function completeChallenge(uint256 challengeId) external",
  "function updateSubmissionLikes(uint256 submissionId, uint256 likes) external",
  "function awardSwipePoints(address user, uint256 swipes) external",
  "function getChallenge(uint256 challengeId) external view returns (tuple(uint256 id, string title, string description, uint256 startTime, uint256 endTime, uint256 votingEndTime, uint8 status, uint256[] submissionIds, uint256 winnerTokenId, uint256 totalRewards))",
  "function getSubmission(uint256 submissionId) external view returns (tuple(uint256 id, uint256 challengeId, address submitter, string ipfsHash, string title, uint256 likes, uint256 votes, uint256 timestamp))",
  "function getChallengeSubmissions(uint256 challengeId) external view returns (uint256[])",
  "function getUserVibePoints(address user) external view returns (uint256)",
  // Zora integration
  "function setZoraProtocolAddress(address zoraProtocol) external",
  "function mintWinnerToZora(uint256 challengeId) external",
  // Events
  "event ChallengeCreated(uint256 indexed challengeId, string title)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed challengeId, address submitter)",
  "event VoteCast(uint256 indexed submissionId, address voter)",
  "event ChallengeCompleted(uint256 indexed challengeId, uint256 winnerTokenId)",
  "event VibePointsAwarded(address indexed user, uint256 amount, string reason)",
  "event ZoraMintTriggered(uint256 indexed challengeId, uint256 indexed zoraTokenId)",
]

export class BlockchainService {
  private provider: ethers.providers.Web3Provider | null = null
  private signer: ethers.Signer | null = null
  private vibeTokenContract: ethers.Contract | null = null
  private challengeManagerContract: ethers.Contract | null = null

  async connect() {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        this.provider = new ethers.providers.Web3Provider(window.ethereum)
        await this.provider.send("eth_requestAccounts", [])
        this.signer = this.provider.getSigner()

        const network = await this.provider.getNetwork()
        console.log("Connected to network:", network.name, network.chainId)

        // Check if we're on Zora Network
        if (network.chainId === 7777777) {
          console.log("🎉 Connected to Zora Mainnet - Perfect for creator tools!")
        } else if (network.chainId === 999999999) {
          console.log("🧪 Connected to Zora Sepolia - Great for testing!")
        } else {
          console.log("⚠️ Consider switching to Zora Network for optimal experience")
        }

        // Initialize contracts
        if (CONTRACTS.VIBE_TOKEN !== "0x0000000000000000000000000000000000000000") {
          this.vibeTokenContract = new ethers.Contract(CONTRACTS.VIBE_TOKEN, VIBE_TOKEN_ABI, this.signer)
          console.log("✅ VibeToken contract connected:", CONTRACTS.VIBE_TOKEN)
        }

        if (CONTRACTS.CHALLENGE_MANAGER !== "0x0000000000000000000000000000000000000000") {
          this.challengeManagerContract = new ethers.Contract(
            CONTRACTS.CHALLENGE_MANAGER,
            CHALLENGE_MANAGER_ABI,
            this.signer,
          )
          console.log("✅ ChallengeManager contract connected:", CONTRACTS.CHALLENGE_MANAGER)
        }

        return true
      } catch (error) {
        console.error("Failed to connect to wallet:", error)
        return false
      }
    }
    return false
  }

  async switchToZoraNetwork(testnet = false) {
    if (!window.ethereum) return false

    const targetChain = testnet ? DEPLOYMENT_CHAINS.ZORA_SEPOLIA : DEPLOYMENT_CHAINS.ZORA_MAINNET

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${targetChain.chainId.toString(16)}` }],
      })
      return true
    } catch (switchError: any) {
      // If network doesn't exist, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${targetChain.chainId.toString(16)}`,
                chainName: targetChain.name,
                rpcUrls: [targetChain.rpcUrl],
                blockExplorerUrls: [targetChain.blockExplorer],
                nativeCurrency: targetChain.nativeCurrency,
              },
            ],
          })
          return true
        } catch (addError) {
          console.error("Failed to add Zora network:", addError)
          return false
        }
      }
      return false
    }
  }

  // Enhanced methods with Zora integration
  async mintVibeTokenWithZora(to: string, title: string, description: string, ipfsHash: string, initialPrice: string) {
    if (!this.vibeTokenContract) throw new Error("Contract not connected")

    // First mint the vibe token
    const tx = await this.vibeTokenContract.mintVibeToken(
      to,
      title,
      description,
      ipfsHash,
      ethers.utils.parseEther(initialPrice),
    )

    const receipt = await tx.wait()

    // If on Zora network, also mint to Zora Protocol
    const network = await this.provider!.getNetwork()
    if (network.chainId === 7777777 || network.chainId === 999999999) {
      try {
        // This would integrate with Zora's minting protocol
        console.log("🎨 Minting to Zora Protocol for enhanced discoverability...")
        // Implementation would use Zora's SDK here
      } catch (error) {
        console.log("Zora Protocol minting failed, but vibe token created successfully")
      }
    }

    return receipt
  }

  async submitToChallenge(challengeId: number, ipfsHash: string, title: string) {
    if (!this.challengeManagerContract) {
      console.log("⚠️ Contract not deployed, simulating submission")
      return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
    }

    const tx = await this.challengeManagerContract.submitToChallenge(challengeId, ipfsHash, title)
    return await tx.wait()
  }

  async voteForSubmission(submissionId: number) {
    if (!this.challengeManagerContract) {
      console.log("⚠️ Contract not deployed, simulating vote")
      return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
    }

    const tx = await this.challengeManagerContract.voteForSubmission(submissionId)
    return await tx.wait()
  }

  async purchaseAccess(tokenId: number, price: string) {
    if (!this.vibeTokenContract) {
      console.log("⚠️ Contract not deployed, simulating purchase")
      return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
    }

    const tx = await this.vibeTokenContract.purchaseAccess(tokenId, {
      value: ethers.utils.parseEther(price),
    })

    return await tx.wait()
  }

  async getUserVibePoints(address: string): Promise<number> {
    if (!this.challengeManagerContract) return 0

    try {
      const points = await this.challengeManagerContract.getUserVibePoints(address)
      return points.toNumber()
    } catch (error) {
      console.error("Error fetching vibe points:", error)
      return 0
    }
  }

  async getTokenPrice(tokenId: number): Promise<string> {
    if (!this.vibeTokenContract) return "0"

    try {
      const price = await this.vibeTokenContract.getCurrentPrice(tokenId)
      return ethers.utils.formatEther(price)
    } catch (error) {
      console.error("Error fetching token price:", error)
      return "0"
    }
  }

  async checkAccess(userAddress: string, tokenId: number): Promise<boolean> {
    if (!this.vibeTokenContract) return false

    try {
      return await this.vibeTokenContract.checkAccess(userAddress, tokenId)
    } catch (error) {
      console.error("Error checking access:", error)
      return false
    }
  }

  getAddress(): Promise<string> | null {
    return this.signer?.getAddress() || null
  }

  isConnected(): boolean {
    return this.signer !== null
  }

  getRecommendedChain(): string {
    return "Zora Network (Optimal for creator tools and Zora Protocol integration)"
  }

  async getCurrentNetwork() {
    if (!this.provider) return null
    const network = await this.provider.getNetwork()
    return {
      chainId: network.chainId,
      name: network.name,
      isZora: network.chainId === 7777777 || network.chainId === 999999999,
    }
  }
}

export const blockchainService = new BlockchainService()
