import { farcasterService, type FarcasterCast } from "./farcaster-service"

export interface TrendAnalysis {
  topics: string[]
  sentiment: "positive" | "negative" | "neutral"
  engagement: number
  keywords: string[]
  suggestedPrompts: string[]
  confidence: number
}

export interface VibeChallenge {
  id: string
  title: string
  description: string
  category: string
  status: "active" | "voting" | "completed"
  createdAt: Date
  endTime: Date
  trendingTopics: string[]
  submissions: Submission[]
  totalLikes: number
  aiGenerated: boolean
  confidence: number
}

export interface Submission {
  id: string
  challengeId: string
  type: "image" | "text" | "link"
  content: string
  title: string
  author: string
  authorId: string
  createdAt: Date
  likes: number
  shares: number
  votes: number
  ipfsHash?: string
}

export class AITrendAnalyzer {
  private cache = new Map<string, { data: TrendAnalysis; timestamp: number }>()
  private cacheTimeout = 10 * 60 * 1000 // 10 minutes

  async analyzeTrends(): Promise<TrendAnalysis> {
    const cacheKey = "trend_analysis"
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data
    }

    try {
      // Get trending casts from Farcaster
      const casts = await farcasterService.getTrendingCasts(100)

      // Perform comprehensive trend analysis
      const analysis = this.performAdvancedTrendAnalysis(casts)

      // Cache the result
      this.cache.set(cacheKey, { data: analysis, timestamp: Date.now() })

      return analysis
    } catch (error) {
      console.error("Failed to analyze trends:", error)
      // Return fallback analysis
      return this.getFallbackTrendAnalysis()
    }
  }

  private performAdvancedTrendAnalysis(casts: FarcasterCast[]): TrendAnalysis {
    // Extract and analyze text content
    const allText = casts.map((cast) => cast.text.toLowerCase()).join(" ")
    const words = this.extractWords(allText)

    // Calculate word frequencies
    const wordFreq = this.calculateWordFrequency(words)

    // Extract trending topics
    const topics = this.extractTrendingTopics(wordFreq, casts)

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(allText)

    // Calculate engagement metrics
    const engagement = this.calculateEngagement(casts)

    // Extract keywords
    const keywords = this.extractKeywords(wordFreq, topics)

    // Generate AI prompts
    const suggestedPrompts = this.generateAIPrompts(topics, sentiment, engagement)

    // Calculate confidence score
    const confidence = this.calculateConfidence(casts, topics, engagement)

    return {
      topics,
      sentiment,
      engagement,
      keywords,
      suggestedPrompts,
      confidence,
    }
  }

  private extractWords(text: string): string[] {
    return text
      .replace(/[^\w\s#@]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 2)
      .map((word) => word.toLowerCase())
  }

  private calculateWordFrequency(words: string[]): Record<string, number> {
    const freq: Record<string, number> = {}
    words.forEach((word) => {
      freq[word] = (freq[word] || 0) + 1
    })
    return freq
  }

  private extractTrendingTopics(wordFreq: Record<string, number>, casts: FarcasterCast[]): string[] {
    // Define topic categories with their keywords
    const topicCategories = {
      crypto: ["bitcoin", "ethereum", "crypto", "btc", "eth", "defi", "web3", "blockchain"],
      memecoins: ["dogecoin", "shib", "pepe", "doge", "meme", "memecoin"],
      nft: ["nft", "opensea", "zora", "art", "collection", "mint"],
      ai: ["ai", "artificial", "intelligence", "machine", "learning", "gpt"],
      gaming: ["gaming", "game", "play", "esports", "metaverse"],
      social: ["farcaster", "warpcast", "social", "community", "network"],
    }

    const topicScores: Record<string, number> = {}

    // Score topics based on frequency and engagement
    Object.entries(topicCategories).forEach(([topic, keywords]) => {
      let score = 0
      keywords.forEach((keyword) => {
        if (wordFreq[keyword]) {
          score += wordFreq[keyword]

          // Boost score based on engagement of casts containing this keyword
          casts.forEach((cast) => {
            if (cast.text.toLowerCase().includes(keyword)) {
              const engagement = cast.reactions.likes_count + cast.reactions.recasts_count
              score += engagement * 0.1
            }
          })
        }
      })
      if (score > 0) {
        topicScores[topic] = score
      }
    })

    // Return top topics sorted by score
    return Object.entries(topicScores)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([topic]) => topic)
  }

  private analyzeSentiment(text: string): "positive" | "negative" | "neutral" {
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
      "excited",
      "love",
      "awesome",
      "fantastic",
      "excellent",
      "outstanding",
      "revolutionary",
    ]

    const negativeWords = [
      "dump",
      "crash",
      "down",
      "fall",
      "bad",
      "terrible",
      "bearish",
      "decline",
      "regret",
      "disappointed",
      "worried",
      "concerned",
      "problem",
      "issue",
      "fail",
    ]

    let positiveScore = 0
    let negativeScore = 0

    positiveWords.forEach((word) => {
      const matches = (text.match(new RegExp(word, "g")) || []).length
      positiveScore += matches
    })

    negativeWords.forEach((word) => {
      const matches = (text.match(new RegExp(word, "g")) || []).length
      negativeScore += matches
    })

    if (positiveScore > negativeScore * 1.2) return "positive"
    if (negativeScore > positiveScore * 1.2) return "negative"
    return "neutral"
  }

  private calculateEngagement(casts: FarcasterCast[]): number {
    if (casts.length === 0) return 0

    const totalEngagement = casts.reduce(
      (sum, cast) => sum + cast.reactions.likes_count + cast.reactions.recasts_count + cast.reactions.replies_count,
      0,
    )

    return totalEngagement / casts.length
  }

  private extractKeywords(wordFreq: Record<string, number>, topics: string[]): string[] {
    // Combine topic-related keywords with high-frequency words
    const topWords = Object.entries(wordFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word)

    // Filter out common words and combine with topics
    const commonWords = [
      "the",
      "and",
      "for",
      "are",
      "but",
      "not",
      "you",
      "all",
      "can",
      "had",
      "her",
      "was",
      "one",
      "our",
      "out",
      "day",
      "get",
      "has",
      "him",
      "his",
      "how",
      "man",
      "new",
      "now",
      "old",
      "see",
      "two",
      "way",
      "who",
      "boy",
      "did",
      "its",
      "let",
      "put",
      "say",
      "she",
      "too",
      "use",
    ]

    const keywords = [...topics, ...topWords.filter((word) => !commonWords.includes(word))]

    return [...new Set(keywords)].slice(0, 10)
  }

  private generateAIPrompts(
    topics: string[],
    sentiment: "positive" | "negative" | "neutral",
    engagement: number,
  ): string[] {
    const contentTypes = ["meme", "GIF", "video", "artwork", "story"]
    const sentimentModifiers = {
      positive: ["celebrating", "showcasing", "hyping"],
      negative: ["reacting to", "commenting on", "analyzing"],
      neutral: ["exploring", "discussing", "explaining"],
    }

    const prompts: string[] = []

    // Generate prompts based on trending topics
    topics.forEach((topic, index) => {
      if (index < 3) {
        // Limit to top 3 topics
        const contentType = contentTypes[index % contentTypes.length]
        const modifier = sentimentModifiers[sentiment][index % sentimentModifiers[sentiment].length]

        prompts.push(`Create a viral ${contentType} ${modifier} ${topic}'s latest developments`)
      }
    })

    // Add engagement-based prompts
    if (engagement > 100) {
      prompts.push(`Create content about the hottest trend everyone's talking about`)
    }

    // Add sentiment-specific prompts
    if (sentiment === "positive") {
      prompts.push(`Make a celebration post about the bullish crypto market`)
    } else if (sentiment === "negative") {
      prompts.push(`Create a reaction meme to recent market movements`)
    }

    return prompts.slice(0, 5)
  }

  private calculateConfidence(casts: FarcasterCast[], topics: string[], engagement: number): number {
    let confidence = 0.5 // Base confidence

    // Boost confidence based on data quality
    if (casts.length >= 50) confidence += 0.2
    if (casts.length >= 100) confidence += 0.1

    // Boost confidence based on topic diversity
    if (topics.length >= 3) confidence += 0.1
    if (topics.length >= 5) confidence += 0.1

    // Boost confidence based on engagement
    if (engagement > 50) confidence += 0.1
    if (engagement > 100) confidence += 0.1

    return Math.min(confidence, 1.0)
  }

  private getFallbackTrendAnalysis(): TrendAnalysis {
    return {
      topics: ["crypto", "defi", "nft", "ethereum", "bitcoin"],
      sentiment: "positive",
      engagement: 75.5,
      keywords: ["crypto", "defi", "ethereum", "bitcoin", "nft", "web3", "blockchain", "trading", "moon", "bullish"],
      suggestedPrompts: [
        "Create a viral meme celebrating crypto's latest surge",
        "Make a GIF about DeFi innovation in 2025",
        "Create artwork showcasing NFT creativity",
      ],
      confidence: 0.7,
    }
  }

  async generateDailyChallenges(): Promise<VibeChallenge[]> {
    try {
      const analysis = await this.analyzeTrends()
      const challenges: VibeChallenge[] = []

      // Create challenges based on REAL trending topics
      const challengeTemplates = [
        {
          title: `Create a meme about ${analysis.topics[0] || "crypto"}'s latest surge`,
          description: `The ${analysis.topics[0] || "crypto"} community is buzzing! Create viral content that captures the current sentiment. Based on ${analysis.engagement.toFixed(0)} average engagement from trending casts.`,
          category: analysis.topics[0] || "crypto",
        },
        {
          title: `Show your take on ${analysis.topics[1] || "DeFi"} innovation`,
          description: `${analysis.topics[1] || "DeFi"} is trending with ${analysis.sentiment} sentiment. Share your perspective on the latest developments in this space.`,
          category: analysis.topics[1] || "defi",
        },
        {
          title: `React to the ${analysis.sentiment === "positive" ? "bullish" : analysis.sentiment === "negative" ? "bearish" : "mixed"} market vibes`,
          description: `Current market sentiment is ${analysis.sentiment} based on ${analysis.keywords.length} trending keywords. Create content that reflects or challenges this mood.`,
          category: "trading",
        },
      ]

      challengeTemplates.forEach((template, index) => {
        const challenge: VibeChallenge = {
          id: `challenge_${Date.now()}_${index}`,
          title: template.title,
          description: template.description,
          category: template.category,
          status: "active",
          createdAt: new Date(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          trendingTopics: analysis.topics,
          submissions: [],
          totalLikes: 0,
          aiGenerated: true,
          confidence: analysis.confidence,
        }
        challenges.push(challenge)
      })

      return challenges
    } catch (error) {
      console.error("Failed to generate daily challenges:", error)
      // Return fallback challenges if API fails
      return this.getFallbackChallenges()
    }
  }

  private getFallbackChallenges(): VibeChallenge[] {
    return [
      {
        id: `challenge_fallback_${Date.now()}`,
        title: "Create content about the hottest crypto trend",
        description:
          "Share your take on what's trending in crypto right now. This challenge was generated when real trend data wasn't available.",
        category: "crypto",
        status: "active",
        createdAt: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        trendingTopics: ["crypto", "bitcoin", "ethereum"],
        submissions: [],
        totalLikes: 0,
        aiGenerated: true,
        confidence: 0.5,
      },
    ]
  }
}

export const aiTrendAnalyzer = new AITrendAnalyzer()
