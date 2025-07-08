import { type NextRequest, NextResponse } from "next/server"
import { farcasterService } from "@/lib/farcaster-service"

export async function GET(request: NextRequest, { params }: { params: { fid: string } }) {
  try {
    const fid = Number.parseInt(params.fid)

    // Get user's recent casts
    const casts = await farcasterService.getUserCasts(fid, 50)

    // Analyze interests from cast content
    const interests = analyzeUserInterests(casts)

    return NextResponse.json({
      success: true,
      data: { interests },
    })
  } catch (error) {
    console.error("Error analyzing user interests:", error)
    return NextResponse.json({ success: false, error: "Failed to analyze interests" }, { status: 500 })
  }
}

function analyzeUserInterests(casts: any[]) {
  const topics = new Set<string>()
  const channels = new Set<string>()
  const categories: Record<string, number> = {}

  // Keywords for different categories
  const categoryKeywords = {
    crypto: ["bitcoin", "ethereum", "crypto", "defi", "nft", "web3", "blockchain"],
    tech: ["ai", "ml", "tech", "coding", "development", "programming"],
    social: ["community", "social", "friends", "network", "people"],
    art: ["art", "design", "creative", "artist", "visual", "aesthetic"],
    gaming: ["game", "gaming", "play", "esports", "gamer"],
    finance: ["finance", "trading", "investment", "money", "market"],
  }

  let totalEngagement = 0

  casts.forEach((cast) => {
    const text = cast.text.toLowerCase()
    const engagement = cast.reactions.likes_count + cast.reactions.recasts_count + cast.reactions.replies_count
    totalEngagement += engagement

    // Extract topics from hashtags and mentions
    const hashtags = text.match(/#\w+/g) || []
    hashtags.forEach((tag) => topics.add(tag.slice(1)))

    // Add channel if present
    if (cast.channel) {
      channels.add(cast.channel.id)
    }

    // Categorize content
    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      const matches = keywords.filter((keyword) => text.includes(keyword)).length
      if (matches > 0) {
        categories[category] = (categories[category] || 0) + matches * engagement
      }
    })
  })

  const engagementScore = casts.length > 0 ? totalEngagement / casts.length : 0

  return {
    topics: Array.from(topics).slice(0, 10),
    channels: Array.from(channels).slice(0, 5),
    engagementScore,
    categories,
  }
}
