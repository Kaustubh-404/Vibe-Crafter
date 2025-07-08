import { NextResponse } from "next/server"
import { aiTrendAnalyzer } from "@/lib/ai-trend-analyzer"

export async function GET() {
  try {
    // Generate AI challenges based on current trends
    const challenges = await aiTrendAnalyzer.generateDailyChallenges()

    return NextResponse.json({
      success: true,
      challenges,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to generate challenges:", error)
    return NextResponse.json({ success: false, error: "Failed to load challenges" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title, description, duration } = await request.json()

    // In a real implementation, this would create a challenge on the blockchain
    const challengeId = `challenge_${Date.now()}`

    return NextResponse.json({
      success: true,
      challengeId,
      message: "Challenge created successfully",
    })
  } catch (error) {
    console.error("Failed to create challenge:", error)
    return NextResponse.json({ success: false, error: "Failed to create challenge" }, { status: 500 })
  }
}
