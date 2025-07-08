"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, Clock, Users, Sparkles, TrendingUp, MessageCircle, Zap } from "lucide-react"
import { useVibeStore } from "@/lib/store"
import { farcasterService } from "@/lib/farcaster-service"
import { toast } from "@/hooks/use-toast"

export default function VibeFeed() {
  const { challenges, loadChallenges, joinChallenge, addVibePoints } = useVibeStore()
  const [loading, setLoading] = useState(true)
  const [trendingCasts, setTrendingCasts] = useState<any[]>([])
  const [expandedChallenges, setExpandedChallenges] = useState<Set<string>>(new Set())

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        await loadChallenges()

        // Fetch trending casts for inspiration
        try {
          const casts = await farcasterService.getTrendingCasts(10)
          setTrendingCasts(casts)
        } catch (error) {
          console.error("Failed to fetch trending casts:", error)
          toast({
            title: "Failed to fetch trending casts",
            description: "Please try again later.",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Failed to load challenges:", error)
        toast({
          title: "Failed to load challenges",
          description: error.message || "Please try again later.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [loadChallenges])

  const handleJoinChallenge = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId)
      toast({
        title: "Challenge joined! 🎉",
        description: "You earned 1 VP for joining. Start creating your vibe!",
      })
    } catch (error) {
      toast({
        title: "Failed to join challenge",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLikeCast = async (castHash: string) => {
    // Simulate liking a cast
    setTrendingCasts((prev) =>
      prev.map((cast) =>
        cast.hash === castHash
          ? { ...cast, reactions: { ...cast.reactions, likes_count: cast.reactions.likes_count + 1 } }
          : cast,
      ),
    )

    addVibePoints(0.1)
    toast({
      title: "Cast liked! ❤️",
      description: "You earned 0.1 VP for engaging with trending content!",
    })
  }

  const handleShareChallenge = async (challenge: any) => {
    const shareText = `Check out this AI-generated vibe challenge: "${challenge.title}" on DeaVibeCrafter! 🚀 #DeaVibeCrafter #Farcaster`

    if (navigator.share) {
      try {
        await navigator.share({
          title: challenge.title,
          text: shareText,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Share cancelled")
      }
    } else {
      await navigator.clipboard.writeText(shareText)
      toast({
        title: "Copied to clipboard! 📋",
        description: "Share this challenge on Farcaster!",
      })
    }
  }

  const toggleChallengeExpansion = (challengeId: string) => {
    setExpandedChallenges((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId)
      } else {
        newSet.add(challengeId)
      }
      return newSet
    })
  }

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const renderTrendingSection = () => (
    <Card className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-purple-700">
          <TrendingUp className="w-5 h-5" />
          <span>Trending on Farcaster</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trendingCasts.slice(0, 3).map((cast, index) => (
            <div
              key={cast.hash}
              className="flex items-start space-x-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow"
            >
              <img
                src={cast.author.pfp_url || "/placeholder.svg?height=32&width=32"}
                alt={cast.author.display_name}
                className="w-8 h-8 rounded-full"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-semibold text-sm">{cast.author.display_name}</span>
                  <span className="text-xs text-gray-500">@{cast.author.username}</span>
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                </div>
                <p className="text-sm text-gray-700 line-clamp-2 mb-2">{cast.text}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{cast.reactions.likes_count} likes</span>
                    <span>{cast.reactions.recasts_count} recasts</span>
                    <span>{cast.reactions.replies_count} replies</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeCast(cast.hash)}
                      className="text-gray-500 hover:text-red-500 h-6 px-2"
                    >
                      <Heart className="w-3 h-3 mr-1" />
                      Like
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-500 hover:text-blue-500 h-6 px-2">
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  // Add this method to show real data source
  const renderDataSource = () => (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-green-800">
          Live Data: Challenges generated from real Farcaster trends
        </span>
      </div>
      <p className="text-xs text-green-700 mt-1">
        Last updated: {new Date().toLocaleTimeString()} • Source: Neynar API
      </p>
    </div>
  )

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Vibe Challenges</h2>
        <p className="text-gray-600">Create content based on real Farcaster trends and earn rewards</p>
      </div>

      {!loading && renderTrendingSection()}

      {/* Add this before the challenges map */}
      {!loading && challenges.length > 0 && renderDataSource()}

      <div className="space-y-4">
        {challenges.map((challenge) => {
          const isExpanded = expandedChallenges.has(challenge.id)
          const timeRemaining = getTimeRemaining(new Date(challenge.endTime))

          return (
            <Card
              key={challenge.id}
              className="overflow-hidden hover:shadow-lg transition-shadow border-l-4 border-l-purple-500"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <CardTitle className="text-lg font-semibold text-gray-900">{challenge.title}</CardTitle>
                      {challenge.aiGenerated && (
                        <Badge variant="outline" className="text-purple-600 border-purple-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                    </div>

                    <p className={`text-gray-600 text-sm mb-3 ${!isExpanded ? "line-clamp-2" : ""}`}>
                      {challenge.description}
                    </p>

                    {challenge.description.length > 100 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleChallengeExpansion(challenge.id)}
                        className="text-purple-600 hover:text-purple-700 p-0 h-auto"
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </Button>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-3">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{timeRemaining} left</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{challenge.submissions?.length || 0} submissions</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{challenge.totalLikes || 0} total likes</span>
                      </div>
                      {challenge.confidence && (
                        <div className="flex items-center space-x-1">
                          <Zap className="w-4 h-4" />
                          <span>{Math.round(challenge.confidence * 100)}% confidence</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant={challenge.status === "active" ? "default" : "secondary"}
                    className={challenge.status === "active" ? "bg-green-100 text-green-700" : ""}
                  >
                    {challenge.status === "active" ? "Live" : challenge.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{challenge.category}</Badge>
                    {challenge.status === "active" && (
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareChallenge(challenge)}
                      className="text-gray-600 hover:text-purple-600 bg-transparent"
                    >
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      size="sm"
                    >
                      Join Challenge
                    </Button>
                  </div>
                </div>

                {challenge.trendingTopics && challenge.trendingTopics.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Trending topics:</p>
                    <div className="flex flex-wrap gap-1">
                      {challenge.trendingTopics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show recent submissions preview */}
                {challenge.submissions && challenge.submissions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Recent submissions:</p>
                    <div className="flex space-x-2">
                      {challenge.submissions.slice(0, 3).map((submission) => (
                        <div key={submission.id} className="flex-1 bg-gray-50 p-2 rounded text-xs">
                          <p className="font-medium truncate">{submission.title}</p>
                          <p className="text-gray-500">by {submission.author}</p>
                        </div>
                      ))}
                      {challenge.submissions.length > 3 && (
                        <div className="flex items-center justify-center bg-gray-100 p-2 rounded text-xs text-gray-500">
                          +{challenge.submissions.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {challenges.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating AI Challenges</h3>
            <p className="text-gray-600">Our AI is analyzing Farcaster trends to create new challenges!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
