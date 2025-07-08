// API Configuration
export const API_ENDPOINTS = {
  NEYNAR: "https://api.neynar.com/v2",
  PINATA: "https://api.pinata.cloud",
  ZORA: "https://api.zora.co/v1",
  UNISWAP: "https://api.uniswap.org/v1",
} as const

export const SUPPORTED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
] as const

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const VIBE_POINT_REWARDS = {
  SUBMISSION: 5,
  SWIPE: 0.1,
  VOTE_WINNER: 5,
  CHALLENGE_JOIN: 1,
  DAILY_LOGIN: 2,
} as const

export const TRADING_FEES = {
  PLATFORM_FEE: 0.05, // 5%
  ENGAGEMENT_FEE: 0.25, // 25%
  CREATOR_SHARE: 0.1, // 10%
} as const
