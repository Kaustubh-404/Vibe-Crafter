"use client"

// Airstack API as alternative for Farcaster data (has free tier)
const AIRSTACK_API_URL = "https://api.airstack.xyz/gql"

export interface AirstackCast {
  hash: string
  text: string
  castedAtTimestamp: string
  numberOfLikes: number
  numberOfRecasts: number
  numberOfReplies: number
  castedBy: {
    profileName: string
    profileDisplayName: string
    profileImage: string
    fid: string
  }
}

export class AirstackAPI {
  private apiKey: string

  constructor(apiKey?: string) {
    // Airstack has a generous free tier
    this.apiKey = apiKey || "demo" // They provide demo access
  }

  async getTrendingFarcasterCasts(limit = 25): Promise<AirstackCast[]> {
    const query = `
      query GetTrendingCasts($limit: Int!) {
        FarcasterCasts(
          input: {
            filter: {
              castedAtTimestamp: {_gte: "${new Date(Date.now() - 86400000).toISOString()}"}
            }
            blockchain: ALL
            limit: $limit
            order: {numberOfLikes: DESC}
          }
        ) {
          Cast {
            hash
            text
            castedAtTimestamp
            numberOfLikes
            numberOfRecasts
            numberOfReplies
            castedBy {
              profileName
              profileDisplayName
              profileImage
              fid
            }
          }
        }
      }
    `

    try {
      const response = await fetch(AIRSTACK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          query,
          variables: { limit },
        }),
      })

      if (!response.ok) {
        throw new Error(`Airstack API error: ${response.status}`)
      }

      const data = await response.json()
      return data.data?.FarcasterCasts?.Cast || []
    } catch (error) {
      console.error("Airstack API failed:", error)
      return []
    }
  }
}

export const airstackAPI = new AirstackAPI()
