export const API_CONFIG = {
  NEYNAR_API_KEY: process.env.NEXT_PUBLIC_NEYNAR_API_KEY,
  PINATA_JWT: process.env.PINATA_JWT,
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
} as const

// 🔥 UPDATE THESE AFTER DEPLOYMENT
export const BLOCKCHAIN_CONFIG = {
  CHAIN_ID: Number(process.env.NEXT_PUBLIC_CHAIN_ID) || 84532, // Base Sepolia
  CHAIN_NAME: process.env.NEXT_PUBLIC_CHAIN_NAME || "Base Sepolia",
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org",
  BLOCK_EXPLORER: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.basescan.org",

  // Contract addresses from environment variables
  VIBE_TOKEN_ADDRESS: process.env.NEXT_PUBLIC_VIBE_TOKEN_ADDRESS || "",
  CHALLENGE_MANAGER_ADDRESS: process.env.NEXT_PUBLIC_CHALLENGE_MANAGER_ADDRESS || "",
} as const

export const IPFS_CONFIG = {
  GATEWAY_URL: "https://gateway.pinata.cloud/ipfs/",
  PINATA_API_URL: "https://api.pinata.cloud",
} as const

// Validation function
export const validateConfig = () => {
  const missing = []

  if (!BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS) missing.push("VIBE_TOKEN_ADDRESS")
  if (!BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS) missing.push("CHALLENGE_MANAGER_ADDRESS")
  if (!API_CONFIG.NEYNAR_API_KEY) missing.push("NEYNAR_API_KEY")
  if (!API_CONFIG.PINATA_JWT) missing.push("PINATA_JWT")

  if (missing.length > 0) {
    console.warn("⚠️ Missing configuration:", missing.join(", "))
    return false
  }

  console.log("✅ All configuration validated")
  return true
}
