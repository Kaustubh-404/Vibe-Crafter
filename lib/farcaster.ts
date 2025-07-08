"use client"

// Neynar API integration for Farcaster data
const NEYNAR_API_BASE = "https://api.neynar.com/v2"

export interface FarcasterCast {
  hash: string
  author: {
    fid: number
    username: string
    display_name: string
    pfp_url: string
  }
  text: string
  timestamp: string
  reactions: {
    likes_count: number
    recasts_count: number
    replies_count: number
  }
  embeds?: Array<{
    url: string
    metadata?: any
  }>
}

export interface FarcasterUser {
  fid: number
  username: string
  display_name: string
  pfp_url: string
  follower_count: number
  following_count: number
}

export class NeynarAPI {
  private apiKey: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_NEYNAR_API_KEY || ""
  }

  async getTrendingCasts(limit = 50): Promise<FarcasterCast[]> {
    try {
      // Try the feed endpoint first (might be free tier)
      let response = await fetch(`${NEYNAR_API_BASE}/farcaster/feed?feed_type=following&limit=${limit}`, {
        headers: {
          api_key: this.apiKey,
          "Content-Type": "application/json",
        },
      })

      // If that fails, try a different endpoint
      if (!response.ok && response.status === 402) {
        console.log("Trending feed requires paid plan, trying alternative endpoint...")

        // Try getting casts by popular users instead
        response = await fetch(
          `${NEYNAR_API_BASE}/farcaster/cast/conversation?identifier=0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000&type=hash&reply_depth=0&include_chronological_parent_casts=false&limit=${Math.min(limit, 25)}`,
          {
            headers: {
              api_key: this.apiKey,
              "Content-Type": "application/json",
            },
          },
        )
      }

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status} - ${response.statusText}`)
      }

      const data = await response.json()
      return data.casts || data.result?.casts || []
    } catch (error) {
      console.error("Failed to fetch trending casts:", error)
      // Return enhanced mock data for development
      return this.getMockTrendingCasts()
    }
  }

  async searchCasts(query: string, limit = 25): Promise<FarcasterCast[]> {
    try {
      const response = await fetch(
        `${NEYNAR_API_BASE}/farcaster/cast/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          headers: {
            api_key: this.apiKey,
            "Content-Type": "application/json",
          },
        },
      )

      if (!response.ok) {
        if (response.status === 402) {
          console.log("Search requires paid plan, using mock data")
          return this.getMockSearchResults(query)
        }
        throw new Error(`Neynar API error: ${response.status}`)
      }

      const data = await response.json()
      return data.result?.casts || []
    } catch (error) {
      console.error("Failed to search casts:", error)
      return this.getMockSearchResults(query)
    }
  }

  async getCastsByFid(fid: number, limit = 25): Promise<FarcasterCast[]> {
    try {
      const response = await fetch(`${NEYNAR_API_BASE}/farcaster/feed?fid=${fid}&limit=${limit}`, {
        headers: {
          api_key: this.apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Neynar API error: ${response.status}`)
      }

      const data = await response.json()
      return data.casts || []
    } catch (error) {
      console.error("Failed to fetch user casts:", error)
      return []
    }
  }

  async getUserByUsername(username: string): Promise<FarcasterUser | null> {
    try {
      const response = await fetch(`${NEYNAR_API_BASE}/farcaster/user/by_username?username=${username}`, {
        headers: {
          api_key: this.apiKey,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 402) {
          console.log("User lookup requires paid plan")
          return null
        }
        throw new Error(`Neynar API error: ${response.status}`)
      }

      const data = await response.json()
      return data.result?.user || null
    } catch (error) {
      console.error("Failed to fetch user:", error)
      return null
    }
  }

  async publishCast(text: string, embeds?: string[]): Promise<boolean> {
    try {
      // Note: Publishing requires a signer and is more complex
      // This would typically be done through a Farcaster client like Warpcast
      console.log("Publishing cast:", { text, embeds })

      // For demo purposes, we'll simulate success
      return true
    } catch (error) {
      console.error("Failed to publish cast:", error)
      return false
    }
  }

  private getMockSearchResults(query: string): FarcasterCast[] {
    const mockResults = this.getMockTrendingCasts()
    // Filter mock results based on query
    return mockResults.filter(
      (cast) =>
        cast.text.toLowerCase().includes(query.toLowerCase()) ||
        cast.author.username.toLowerCase().includes(query.toLowerCase()),
    )
  }

  private getMockTrendingCasts(): FarcasterCast[] {
    return [
      {
        hash: "0x123abc",
        author: {
          fid: 1,
          username: "cryptoking",
          display_name: "Crypto King 👑",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "Dogecoin to the moon! 🚀 The 2025 surge is just getting started. Who else is hodling? #dogecoin #crypto #moon",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reactions: {
          likes_count: 234,
          recasts_count: 45,
          replies_count: 23,
        },
      },
      {
        hash: "0x456def",
        author: {
          fid: 2,
          username: "ethdev",
          display_name: "ETH Developer ⚡",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "Ethereum 2025 upgrades are game-changing! The scalability improvements are incredible. Building the future of web3 🔥 #ethereum #blockchain #defi",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        reactions: {
          likes_count: 189,
          recasts_count: 67,
          replies_count: 34,
        },
      },
      {
        hash: "0x789ghi",
        author: {
          fid: 3,
          username: "defifarmer",
          display_name: "DeFi Farmer 🌾",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "DeFi summer is back! Yields are looking juicy across all protocols. Time to get farming! 🌾💰 #defi #yield #farming #protocols",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        reactions: {
          likes_count: 156,
          recasts_count: 28,
          replies_count: 19,
        },
      },
      {
        hash: "0xabcdef",
        author: {
          fid: 4,
          username: "nftcollector",
          display_name: "NFT Collector 🎨",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "The NFT space is evolving so fast! Zora's new features are incredible for creators. The future of digital art is bright ✨ #nft #zora #digitalart",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        reactions: {
          likes_count: 98,
          recasts_count: 15,
          replies_count: 12,
        },
      },
      {
        hash: "0x123xyz",
        author: {
          fid: 5,
          username: "web3builder",
          display_name: "Web3 Builder 🛠️",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "Building on Farcaster is amazing! The decentralized social graph opens up so many possibilities. Who's building cool stuff? #farcaster #web3 #social",
        timestamp: new Date(Date.now() - 18000000).toISOString(),
        reactions: {
          likes_count: 145,
          recasts_count: 32,
          replies_count: 28,
        },
      },
      {
        hash: "0xdef456",
        author: {
          fid: 6,
          username: "memecoin_master",
          display_name: "Memecoin Master 🐕",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "SHIB, DOGE, PEPE - the memecoin revolution is real! Which one's your favorite? The community power is unmatched 🚀 #memecoins #community #crypto",
        timestamp: new Date(Date.now() - 21600000).toISOString(),
        reactions: {
          likes_count: 312,
          recasts_count: 89,
          replies_count: 56,
        },
      },
      {
        hash: "0x789abc",
        author: {
          fid: 7,
          username: "airesearcher",
          display_name: "AI Researcher 🤖",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "AI + Crypto = The future! Smart contracts powered by AI are going to revolutionize everything. What use cases are you most excited about? #ai #crypto #innovation",
        timestamp: new Date(Date.now() - 25200000).toISOString(),
        reactions: {
          likes_count: 178,
          recasts_count: 43,
          replies_count: 31,
        },
      },
      {
        hash: "0xabc123",
        author: {
          fid: 8,
          username: "gamefi_guru",
          display_name: "GameFi Guru 🎮",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "Play-to-earn games are getting insane! The graphics, gameplay, and earning potential are all improving rapidly. Gaming + DeFi = 🔥 #gamefi #p2e #gaming",
        timestamp: new Date(Date.now() - 28800000).toISOString(),
        reactions: {
          likes_count: 267,
          recasts_count: 54,
          replies_count: 38,
        },
      },
    ]
  }
}

export const neynarAPI = new NeynarAPI()
