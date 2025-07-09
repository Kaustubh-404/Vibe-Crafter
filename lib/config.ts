

export const API_CONFIG = {
  NEYNAR_API_KEY: process.env.NEXT_PUBLIC_NEYNAR_API_KEY,
  PINATA_JWT: process.env.PINATA_JWT,
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
} as const

// 🔥 BLOCKCHAIN CONFIGURATION - UPDATE THESE WITH YOUR DEPLOYED CONTRACT ADDRESSES
export const BLOCKCHAIN_CONFIG = {
  // Network Configuration
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 84532, // Base Sepolia
  CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || "Base Sepolia",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org",
  BLOCK_EXPLORER: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.basescan.org",

  // ⚠️ IMPORTANT: SET THESE AFTER DEPLOYING YOUR CONTRACTS
  VIBE_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_VIBE_TOKEN_ADDRESS || "",
  CHALLENGE_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_CHALLENGE_MANAGER_ADDRESS || "",
  
  // Optional: Platform configuration
  PLATFORM_ADDRESS: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS || "",
  FEE_RECIPIENT: process.env.NEXT_PUBLIC_FEE_RECIPIENT || "",
} as const

export const IPFS_CONFIG = {
  GATEWAY_URL: "https://gateway.pinata.cloud/ipfs/",
  PINATA_API_URL: "https://api.pinata.cloud",
} as const

// Validation function
export const validateConfig = () => {
  const missing = []
  const warnings = []

  // Critical missing configurations
  if (!BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS) missing.push("VIBE_TOKEN_ADDRESS")
  if (!BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS) missing.push("CHALLENGE_MANAGER_ADDRESS")

  // Important but non-critical configurations
  if (!API_CONFIG.NEYNAR_API_KEY) warnings.push("NEYNAR_API_KEY")
  if (!API_CONFIG.PINATA_JWT) warnings.push("PINATA_JWT")

  if (missing.length > 0) {
    console.error("❌ CRITICAL: Missing contract addresses:", missing.join(", "))
    console.error("📋 To fix this:")
    console.error("1. Deploy your contracts using the provided Solidity files")
    console.error("2. Add contract addresses to your .env.local file:")
    console.error("   NEXT_PUBLIC_VIBE_TOKEN_ADDRESS=0x...")
    console.error("   NEXT_PUBLIC_CHALLENGE_MANAGER_ADDRESS=0x...")
    console.error("3. Restart your development server")
    return false
  }

  if (warnings.length > 0) {
    console.warn("⚠️ Optional configurations missing:", warnings.join(", "))
    console.warn("App will work with mock data, but real integrations are disabled")
  }

  console.log("✅ All critical configurations validated")
  console.log("🔗 Contract addresses loaded:")
  console.log(`   VibeToken: ${BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS}`)
  console.log(`   ChallengeManager: ${BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS}`)
  
  return true
}

// Check if contracts are deployed
export const areContractsDeployed = () => {
  return (
    BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS && 
    BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS !== "" &&
    BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS && 
    BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS !== ""
  )
}

// Get deployment instructions
export const getDeploymentInstructions = () => {
  return {
    message: "Smart contracts need to be deployed",
    steps: [
      "Get testnet ETH from Base Sepolia faucet",
      "Deploy contracts using Remix IDE or Hardhat",
      "Copy contract addresses to .env.local",
      "Restart the application",
    ],
    links: {
      faucet: "https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet",
      remix: "https://remix.ethereum.org",
      docs: "See contracts/deployment-guide.md for detailed instructions"
    }
  }
} 