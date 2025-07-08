export interface FarcasterUser {
  fid: number
  username: string
  display_name: string
  pfp_url: string
  follower_count: number
  following_count: number
  bio?: string
  verified?: boolean
}

export interface FarcasterCast {
  hash: string
  author: FarcasterUser
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
  channel?: {
    id: string
    name: string
  }
}

export interface UserInterests {
  topics: string[]
  channels: string[]
  engagementScore: number
  categories: Record<string, number>
}

class RealFarcasterService {
  private baseUrl = "/api/farcaster"
  private cache = new Map()
  private cacheTimeout = 5 * 60 * 1000 // 5 minutes

  private getCacheKey(key: string): string {
    return `${key}_${Date.now()}`
  }

  private isValidCache(timestamp: number): boolean {
    return Date.now() - timestamp < this.cacheTimeout
  }

  async getUserByFid(fid: number): Promise<FarcasterUser> {
    const cacheKey = `user_${fid}`
    const cached = this.cache.get(cacheKey)

    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data
    }

    try {
      const response = await fetch(`${this.baseUrl}/user/${fid}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch user")
      }

      this.cache.set(cacheKey, { data: result.data, timestamp: Date.now() })
      return result.data
    } catch (error) {
      console.error("Error fetching user:", error)
      throw error
    }
  }

  async getUserCasts(fid: number, limit = 25): Promise<FarcasterCast[]> {
    try {
      const response = await fetch(`${this.baseUrl}/casts/${fid}?limit=${limit}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch casts")
      }

      return result.data
    } catch (error) {
      console.error("Error fetching user casts:", error)
      throw error
    }
  }

  async getUserInterests(fid: number): Promise<UserInterests> {
    try {
      const response = await fetch(`${this.baseUrl}/interests/${fid}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch interests")
      }

      return result.data.interests
    } catch (error) {
      console.error("Error fetching user interests:", error)
      // Return default interests on error
      return {
        topics: ["crypto", "web3"],
        channels: ["general"],
        engagementScore: 0,
        categories: { general: 1 },
      }
    }
  }

  async getTrendingCasts(limit = 50): Promise<FarcasterCast[]> {
    try {
      const response = await fetch(`${this.baseUrl}/trending?limit=${limit}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch trending casts")
      }

      return result.data
    } catch (error) {
      console.error("Error fetching trending casts:", error)
      throw error
    }
  }

  async searchCasts(query: string, limit = 25): Promise<FarcasterCast[]> {
    try {
      const response = await fetch(`${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to search casts")
      }

      return result.data
    } catch (error) {
      console.error("Error searching casts:", error)
      throw error
    }
  }

  async publishCast(text: string, embeds?: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text, embeds }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error("Error publishing cast:", error)
      return false
    }
  }
}

export const farcasterService = new RealFarcasterService()
