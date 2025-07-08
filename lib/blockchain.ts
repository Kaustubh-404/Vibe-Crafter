import { ethers } from "ethers"

// Contract addresses - UPDATE THESE AFTER DEPLOYMENT
export const CONTRACTS = {
  VIBE_TOKEN: process.env.NEXT_PUBLIC_VIBE_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
  CHALLENGE_MANAGER: process.env.NEXT_PUBLIC_CHALLENGE_MANAGER_ADDRESS || "0x0000000000000000000000000000000000000000",
}

// 🎯 TESTNET DEPLOYMENT CHAINS
export const DEPLOYMENT_CHAINS = {
  BASE_SEPOLIA: {
    chainId: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    blockExplorer: "https://sepolia.basescan.org",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    isTestnet: true,
    features: ["Zora Coins SDK", "Free Testnet ETH", "Same as Mainnet"],
    isRecommended: true,
    faucet: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
  },
  ZORA_SEPOLIA: {
    chainId: 999999999,
    name: "Zora Sepolia Testnet", 
    rpcUrl: "https://sepolia.rpc.zora.energy",
    blockExplorer: "https://sepolia.explorer.zora.energy",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    isTestnet: true,
    features: ["Native Zora Network", "Creator Tools", "Testing Environment"],
    faucet: "Bridge from Base Sepolia",
  },
  ETHEREUM_SEPOLIA: {
    chainId: 11155111,
    name: "Ethereum Sepolia",
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorer: "https://sepolia.etherscan.io",
    nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
    isTestnet: true,
    features: ["Most Compatible", "Widely Supported", "Bridge to other testnets"],
    faucet: "https://sepoliafaucet.com/",
  },
}

// Enhanced ABIs
export const VIBE_TOKEN_ABI = [
  "function mintVibeToken(address to, string title, string description, string ipfsHash, uint256 initialPrice) external returns (uint256)",
  "function updateEngagement(uint256 tokenId, uint256 likes, uint256 shares) external",
  "function purchaseAccess(uint256 tokenId) external payable",
  "function checkAccess(address user, uint256 tokenId) external view returns (bool)",
  "function getVibeMetadata(uint256 tokenId) external view returns (tuple(string title, string description, string ipfsHash, address creator, uint256 createdAt, uint256 totalLikes, uint256 totalShares, bool isActive))",
  "function getCurrentPrice(uint256 tokenId) external view returns (uint256)",
  "function balanceOf(address account, uint256 id) external view returns (uint256)",
  "event VibeTokenMinted(uint256 indexed tokenId, address indexed creator, string ipfsHash)",
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
  "event ChallengeCreated(uint256 indexed challengeId, string title)",
  "event SubmissionCreated(uint256 indexed submissionId, uint256 indexed challengeId, address submitter)",
  "event VoteCast(uint256 indexed submissionId, address voter)",
  "event ChallengeCompleted(uint256 indexed challengeId, uint256 winnerTokenId)",
  "event VibePointsAwarded(address indexed user, uint256 amount, string reason)",
]

export class BlockchainService {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null
  private vibeTokenContract: ethers.Contract | null = null
  private challengeManagerContract: ethers.Contract | null = null

  async connect() {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        this.provider = new ethers.BrowserProvider(window.ethereum)
        await this.provider.send("eth_requestAccounts", [])
        this.signer = await this.provider.getSigner()

        const network = await this.provider.getNetwork()
        console.log("Connected to network:", network.name, Number(network.chainId))

        // Check if we're on recommended testnet
        if (Number(network.chainId) === 84532) {
          console.log("🧪 Connected to Base Sepolia - Perfect for testnet development!")
        } else if (Number(network.chainId) === 999999999) {
          console.log("🎨 Connected to Zora Sepolia - Great for creator tools testing!")
        } else if (Number(network.chainId) === 11155111) {
          console.log("⚡ Connected to Ethereum Sepolia - Universal testnet!")
        } else {
          console.log("⚠️ Consider switching to Base Sepolia for optimal testnet experience")
        }

        // Initialize contracts if deployed
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

  async switchToBaseSepolia() {
    if (!window.ethereum) return false

    const targetChain = DEPLOYMENT_CHAINS.BASE_SEPOLIA

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
          console.error("Failed to add Base Sepolia network:", addError)
          return false
        }
      }
      return false
    }
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
      value: ethers.parseEther(price),
    })

    return await tx.wait()
  }

  async getUserVibePoints(address: string): Promise<number> {
    if (!this.challengeManagerContract) return 0

    try {
      const points = await this.challengeManagerContract.getUserVibePoints(address)
      return Number(points)
    } catch (error) {
      console.error("Error fetching vibe points:", error)
      return 0
    }
  }

  async getTokenPrice(tokenId: number): Promise<string> {
    if (!this.vibeTokenContract) return "0"

    try {
      const price = await this.vibeTokenContract.getCurrentPrice(tokenId)
      return ethers.formatEther(price)
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

  async getAddress(): Promise<string | null> {
    if (!this.signer) return null
    try {
      return await this.signer.getAddress()
    } catch (error) {
      console.error("Error getting address:", error)
      return null
    }
  }

  isConnected(): boolean {
    return this.signer !== null
  }

  async getCurrentNetwork() {
    if (!this.provider) return null
    try {
      const network = await this.provider.getNetwork()
      return {
        chainId: Number(network.chainId),
        name: network.name,
        isBaseSepolia: Number(network.chainId) === 84532,
        isZoraSepolia: Number(network.chainId) === 999999999,
        isTestnet: [84532, 999999999, 11155111].includes(Number(network.chainId)),
      }
    } catch (error) {
      console.error("Error getting network:", error)
      return null
    }
  }
}

export const blockchainService = new BlockchainService()