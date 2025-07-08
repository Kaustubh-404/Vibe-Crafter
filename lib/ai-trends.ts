"use client"

import { NeynarAPI, type FarcasterCast } from "./farcaster"
import { AirstackAPI } from "./airstack-api"

export interface TrendAnalysis {
  topics: string[]
  sentiment: "positive" | "negative" | "neutral"
  engagement: number
  keywords: string[]
  suggestedPrompts: string[]
}

export class AITrendAnalyzer {
  private neynarAPI: NeynarAPI
  private airstackAPI: AirstackAPI

  constructor() {
    this.neynarAPI = new NeynarAPI()
    this.airstackAPI = new AirstackAPI()
  }

  async analyzeTrends(): Promise<TrendAnalysis> {
    try {
      // Try multiple data sources
      let casts: FarcasterCast[] = []

      // First try Neynar (might be limited on free tier)
      try {
        casts = await this.neynarAPI.getTrendingCasts(50)
        console.log(`Got ${casts.length} casts from Neynar`)
      } catch (error) {
        console.log("Neynar failed, trying Airstack...")

        // Fallback to Airstack
        try {
          const airstackCasts = await this.airstackAPI.getTrendingFarcasterCasts(25)
          casts = this.convertAirstackCasts(airstackCasts)
          console.log(`Got ${casts.length} casts from Airstack`)
        } catch (airstackError) {
          console.log("Airstack also failed, using enhanced mock data")
        }
      }

      // If we still don't have data, use enhanced mock
      if (casts.length === 0) {
        casts = this.getEnhancedMockCasts()
      }

      // Analyze trends using the available data
      const analysis = this.performTrendAnalysis(casts)
      return analysis
    } catch (error) {
      console.error("Failed to analyze trends:", error)
      return this.getMockTrendAnalysis()
    }
  }

  private convertAirstackCasts(airstackCasts: any[]): FarcasterCast[] {
    return airstackCasts.map((cast) => ({
      hash: cast.hash,
      author: {
        fid: Number.parseInt(cast.castedBy.fid),
        username: cast.castedBy.profileName || "unknown",
        display_name: cast.castedBy.profileDisplayName || cast.castedBy.profileName,
        pfp_url: cast.castedBy.profileImage || "/placeholder.svg?height=40&width=40",
      },
      text: cast.text,
      timestamp: cast.castedAtTimestamp,
      reactions: {
        likes_count: cast.numberOfLikes || 0,
        recasts_count: cast.numberOfRecasts || 0,
        replies_count: cast.numberOfReplies || 0,
      },
    }))
  }

  private getEnhancedMockCasts(): FarcasterCast[] {
    // Return more diverse mock data for better trend analysis
    return [
      {
        hash: "0x123abc",
        author: {
          fid: 1,
          username: "cryptoking",
          display_name: "Crypto King 👑",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "Dogecoin to the moon! 🚀 The 2025 surge is just getting started. Who else is hodling? #dogecoin #crypto #moon #bullish",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        reactions: { likes_count: 234, recasts_count: 45, replies_count: 23 },
      },
      {
        hash: "0x456def",
        author: {
          fid: 2,
          username: "ethdev",
          display_name: "ETH Developer ⚡",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "Ethereum 2025 upgrades are game-changing! The scalability improvements are incredible. Building the future of web3 🔥 #ethereum #blockchain #defi #scaling",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        reactions: { likes_count: 189, recasts_count: 67, replies_count: 34 },
      },
      {
        hash: "0x789ghi",
        author: {
          fid: 3,
          username: "defifarmer",
          display_name: "DeFi Farmer 🌾",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "DeFi summer is back! Yields are looking juicy across all protocols. Time to get farming! 🌾💰 #defi #yield #farming #protocols #liquidity",
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        reactions: { likes_count: 156, recasts_count: 28, replies_count: 19 },
      },
      // Add more diverse content for better analysis
      {
        hash: "0xmeme1",
        author: {
          fid: 9,
          username: "meme_lord",
          display_name: "Meme Lord 😂",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "When you see your portfolio pumping but remember you sold yesterday 😭 #crypto #memes #trading #fomo #regret",
        timestamp: new Date(Date.now() - 5400000).toISOString(),
        reactions: { likes_count: 445, recasts_count: 123, replies_count: 67 },
      },
      {
        hash: "0xai1",
        author: {
          fid: 10,
          username: "ai_researcher",
          display_name: "AI Researcher 🤖",
          pfp_url: "/placeholder.svg?height=40&width=40",
        },
        text: "AI agents trading crypto autonomously... we're living in the future! The intersection of AI and DeFi is mind-blowing 🤯 #ai #crypto #automation #future",
        timestamp: new Date(Date.now() - 12600000).toISOString(),
        reactions: { likes_count: 278, recasts_count: 89, replies_count: 45 },
      },
    ]
  }

  // Rest of the methods remain the same...
  private performTrendAnalysis(casts: FarcasterCast[]): TrendAnalysis {
    // Extract keywords and topics
    const allText = casts.map((cast) => cast.text.toLowerCase()).join(" ")
    const words = allText.split(/\s+/).filter((word) => word.length > 3)

    // Count word frequency
    const wordCount: Record<string, number> = {}
    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, "")
      if (cleanWord) {
        wordCount[cleanWord] = (wordCount[cleanWord] || 0) + 1
      }
    })

    // Get top keywords
    const keywords = Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word)

    // Identify crypto/tech topics
    const cryptoKeywords = [
      "bitcoin",
      "ethereum",
      "dogecoin",
      "crypto",
      "defi",
      "nft",
      "blockchain",
      "web3",
      "zora",
      "farcaster",
      "meme",
      "trading",
      "yield",
      "farming",
    ]
    const topics = keywords
      .filter((keyword) => cryptoKeywords.some((crypto) => keyword.includes(crypto)) || keyword.length > 4)
      .slice(0, 5)

    // Calculate average engagement using correct field names
    const totalEngagement = casts.reduce(
      (sum, cast) => sum + cast.reactions.likes_count + cast.reactions.recasts_count + cast.reactions.replies_count,
      0,
    )
    const avgEngagement = totalEngagement / casts.length

    // Determine sentiment (simplified)
    const positiveWords = [
      "moon",
      "bullish",
      "pump",
      "surge",
      "up",
      "rise",
      "good",
      "great",
      "amazing",
      "incredible",
      "bright",
      "future",
      "building",
      "innovation",
    ]
    const negativeWords = ["dump", "crash", "down", "fall", "bad", "terrible", "bearish", "decline", "regret"]

    const positiveCount = positiveWords.reduce(
      (count, word) => count + (allText.match(new RegExp(word, "g")) || []).length,
      0,
    )
    const negativeCount = negativeWords.reduce(
      (count, word) => count + (allText.match(new RegExp(word, "g")) || []).length,
      0,
    )

    let sentiment: "positive" | "negative" | "neutral" = "neutral"
    if (positiveCount > negativeCount * 1.5) sentiment = "positive"
    else if (negativeCount > positiveCount * 1.5) sentiment = "negative"

    // Generate suggested prompts
    const suggestedPrompts = this.generatePrompts(topics, sentiment)

    return {
      topics,
      sentiment,
      engagement: avgEngagement,
      keywords,
      suggestedPrompts,
    }
  }

  private generatePrompts(topics: string[], sentiment: "positive" | "negative" | "neutral"): string[] {
    const promptTemplates = [
      `Create a viral meme about ${topics[0] || "crypto"}'s ${sentiment === "positive" ? "surge" : sentiment === "negative" ? "dip" : "movement"}`,
      `Show your take on the ${topics[1] || "DeFi"} trend everyone's talking about`,
      `Make content celebrating ${topics[0] || "blockchain"} innovation in 2025`,
      `Create a GIF reaction to the latest ${topics[2] || "NFT"} developments`,
      `Share your ${sentiment === "positive" ? "bullish" : sentiment === "negative" ? "bearish" : "neutral"} take on ${topics[0] || "crypto"} markets`,
    ]

    return promptTemplates.slice(0, 3)
  }

  private getMockTrendAnalysis(): TrendAnalysis {
    return {
      topics: ["dogecoin", "ethereum", "defi", "memes", "crypto"],
      sentiment: "positive",
      engagement: 156.7,
      keywords: [
        "dogecoin",
        "moon",
        "ethereum",
        "defi",
        "yield",
        "farming",
        "blockchain",
        "crypto",
        "surge",
        "bullish",
        "memes",
        "trading",
      ],
      suggestedPrompts: [
        "Create a viral meme about Dogecoin's 2025 moonshot",
        "Show your take on the Ethereum upgrade everyone's talking about",
        "Make content celebrating DeFi innovation in 2025",
      ],
    }
  }
}

export const aiTrendAnalyzer = new AITrendAnalyzer()
