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
  private retryCount = 3
  private retryDelay = 1000

  private async fetchWithRetry(url: string, options?: RequestInit, retries = this.retryCount): Promise<Response> {
    try {
      const response = await fetch(url, options)
      if (!response.ok && retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.fetchWithRetry(url, options, retries - 1)
      }
      return response
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        return this.fetchWithRetry(url, options, retries - 1)
      }
      throw error
    }
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
      const response = await this.fetchWithRetry(`${this.baseUrl}/user/${fid}`)
      
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
      console.error(`Error fetching user ${fid}:`, error)
      throw new Error(`Failed to fetch user data for FID ${fid}`)
    }
  }

  async getUserCasts(fid: number, limit = 25): Promise<FarcasterCast[]> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/casts/${fid}?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch casts")
      }

      return result.data
    } catch (error) {
      console.error(`Error fetching casts for user ${fid}:`, error)
      throw new Error(`Failed to fetch casts for user ${fid}`)
    }
  }

  async getUserInterests(fid: number): Promise<UserInterests> {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/interests/${fid}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch interests")
      }

      return result.data.interests
    } catch (error) {
      console.error(`Error fetching interests for user ${fid}:`, error)
      // Return minimal default instead of mock data
      return {
        topics: [],
        channels: [],
        engagementScore: 0,
        categories: {},
      }
    }
  }

  async getTrendingCasts(limit = 50): Promise<FarcasterCast[]> {
    const cacheKey = `trending_${limit}`
    const cached = this.cache.get(cacheKey)

    if (cached && this.isValidCache(cached.timestamp)) {
      return cached.data
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/trending?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch trending casts")
      }

      // Validate the data structure
      const validCasts = result.data.filter((cast: any) => 
        cast.hash && 
        cast.author && 
        cast.text && 
        cast.reactions
      )

      this.cache.set(cacheKey, { data: validCasts, timestamp: Date.now() })
      return validCasts
    } catch (error) {
      console.error("Error fetching trending casts:", error)
      throw new Error("Failed to fetch trending content from Farcaster")
    }
  }

  async searchCasts(query: string, limit = 25): Promise<FarcasterCast[]> {
    if (!query.trim()) {
      throw new Error("Search query cannot be empty")
    }

    try {
      const response = await this.fetchWithRetry(
        `${this.baseUrl}/search?q=${encodeURIComponent(query)}&limit=${limit}`
      )
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || "Failed to search casts")
      }

      return result.data
    } catch (error) {
      console.error(`Error searching casts for "${query}":`, error)
      throw new Error(`Failed to search for "${query}"`)
    }
  }

  async publishCast(text: string, embeds?: string[]): Promise<boolean> {
    if (!text.trim()) {
      throw new Error("Cast text cannot be empty")
    }

    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: text.trim(), embeds }),
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

  // Health check method
  async checkApiHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.ok
    } catch (error) {
      console.error("API health check failed:", error)
      return false
    }
  }

  // Clear cache method
  clearCache(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }
}

export const farcasterService = new RealFarcasterService()