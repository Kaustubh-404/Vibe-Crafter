"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, X, Zap, Trophy, Share2, MessageCircle, SkipForward } from "lucide-react"
import { useVibeStore } from "@/lib/store"
import type { Submission } from "@/lib/ai-trend-analyzer"
import { toast } from "@/hooks/use-toast"

export default function SwipeScreen() {
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [swipeCount, setSwipeCount] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [swipeDirection, setSwipeDirection] = useState<"left" | "right" | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const { challenges, swipeOnSubmission, vibePoints, addVibePoints } = useVibeStore()

  useEffect(() => {
    // Get all submissions from active challenges
    const allSubmissions = challenges
      .filter((c) => c.status === "active" || c.status === "voting")
      .flatMap((c) => c.submissions || [])
      .filter((s) => s.id) // Only submissions with IDs
      .sort(() => Math.random() - 0.5) // Randomize order

    setSubmissions(allSubmissions)
    if (allSubmissions.length > 0) {
      setCurrentSubmission(allSubmissions[0])
    }
  }, [challenges])

  const handleSwipe = async (direction: "left" | "right") => {
    if (!currentSubmission || isAnimating) return

    const isLike = direction === "right"
    setIsAnimating(true)
    setSwipeDirection(direction)

    try {
      await swipeOnSubmission(currentSubmission.id, isLike)
      setSwipeCount((prev) => prev + 1)

      // Animate card out
      if (cardRef.current) {
        cardRef.current.style.transform = `translateX(${direction === "right" ? "100%" : "-100%"}) rotate(${direction === "right" ? "15deg" : "-15deg"})`
        cardRef.current.style.opacity = "0"
      }

      setTimeout(() => {
        // Move to next submission
        const nextIndex = currentIndex + 1
        if (nextIndex < submissions.length) {
          setCurrentIndex(nextIndex)
          setCurrentSubmission(submissions[nextIndex])
        } else {
          setCurrentSubmission(null)
        }

        // Reset animation
        if (cardRef.current) {
          cardRef.current.style.transform = "translateX(0) rotate(0)"
          cardRef.current.style.opacity = "1"
        }
        setIsAnimating(false)
        setSwipeDirection(null)
      }, 300)

      toast({
        title: isLike ? "Loved it! 💜" : "Passed 👋",
        description: `+0.1 VP earned! Total swipes: ${swipeCount + 1}`,
      })
    } catch (error) {
      setIsAnimating(false)
      setSwipeDirection(null)
      toast({
        title: "Swipe failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSkip = () => {
    if (!currentSubmission || isAnimating) return

    const nextIndex = currentIndex + 1
    if (nextIndex < submissions.length) {
      setCurrentIndex(nextIndex)
      setCurrentSubmission(submissions[nextIndex])
    } else {
      setCurrentSubmission(null)
    }
  }

  const handleShare = async () => {
    if (!currentSubmission) return

    const shareText = `Check out this amazing vibe: "${currentSubmission.title}" by ${currentSubmission.author} on DeaVibeCrafter! 🚀`

    if (navigator.share) {
      try {
        await navigator.share({
          title: currentSubmission.title,
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
        description: "Share this vibe on Farcaster!",
      })
    }

    addVibePoints(0.5)
    toast({
      title: "Thanks for sharing! 🎉",
      description: "You earned 0.5 VP for spreading the vibe!",
    })
  }

  if (!currentSubmission) {
    return (
      <div className="text-center py-12">
        <Card>
          <CardContent className="py-12">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {swipeCount > 0 ? "Great job swiping! 🎉" : "No submissions to swipe"}
            </h3>
            <p className="text-gray-600 mb-4">
              {swipeCount > 0
                ? `You've swiped on ${swipeCount} submissions and earned ${(swipeCount * 0.1).toFixed(1)} VP!`
                : "Check back later for new submissions to rate."}
            </p>
            <div className="space-y-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                <Zap className="w-4 h-4 mr-1" />
                {vibePoints} VP Total
              </Badge>
              {swipeCount > 0 && (
                <div className="text-sm text-gray-500">
                  <p>Your swipes help creators get discovered!</p>
                  <p>Keep swiping to earn more VP and influence trends.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Swipe to Rate Vibes</h2>
        <p className="text-gray-600">Swipe right to love it, left to pass. Earn 0.1 VP per swipe!</p>
        <div className="flex items-center justify-center space-x-4 mt-3">
          <Badge variant="outline">
            {currentIndex + 1} of {submissions.length}
          </Badge>
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            <Zap className="w-4 h-4 mr-1" />
            {vibePoints} VP
          </Badge>
          <Badge variant="outline" className="bg-green-100 text-green-700">
            {swipeCount} swipes today
          </Badge>
        </div>
      </div>

      <div className="max-w-md mx-auto relative">
        {/* Next card preview */}
        {submissions[currentIndex + 1] && (
          <Card className="absolute inset-0 transform scale-95 opacity-50 z-0">
            <CardContent className="p-0">
              <div className="h-[500px] bg-gray-100 rounded-lg"></div>
            </CardContent>
          </Card>
        )}

        {/* Current card */}
        <Card
          ref={cardRef}
          className={`relative z-10 overflow-hidden transition-transform duration-300 ${
            isAnimating ? "pointer-events-none" : ""
          }`}
          style={{
            transform: swipeDirection
              ? `translateX(${swipeDirection === "right" ? "100%" : "-100%"}) rotate(${swipeDirection === "right" ? "15deg" : "-15deg"})`
              : "translateX(0) rotate(0)",
          }}
        >
          <CardContent className="p-0">
            <div className="relative">
              {/* Content Display */}
              <div className="p-6 min-h-[500px] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {currentSubmission.author[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{currentSubmission.author}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(currentSubmission.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSkip} className="text-gray-500 hover:text-gray-700">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-4 line-clamp-2">{currentSubmission.title}</h3>

                {/* Content */}
                <div className="flex-1 flex items-center justify-center mb-6">
                  {currentSubmission.type === "image" && (
                    <div className="w-full">
                      {currentSubmission.content.includes("video") ||
                      currentSubmission.content.includes(".mp4") ||
                      currentSubmission.content.includes(".webm") ? (
                        <video
                          src={currentSubmission.content}
                          className="w-full max-h-80 object-cover rounded-lg"
                          controls
                          muted
                          loop
                        />
                      ) : (
                        <img
                          src={currentSubmission.content || "/placeholder.svg"}
                          alt={currentSubmission.title}
                          className="w-full max-h-80 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  )}

                  {currentSubmission.type === "text" && (
                    <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-lg">
                      <p className="text-gray-800 whitespace-pre-wrap text-center leading-relaxed">
                        {currentSubmission.content}
                      </p>
                    </div>
                  )}

                  {currentSubmission.type === "link" && (
                    <div className="w-full bg-blue-50 p-6 rounded-lg text-center">
                      <div className="mb-4">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Share2 className="w-8 h-8 text-blue-600" />
                        </div>
                        <p className="text-blue-800 font-medium mb-2">Shared Link</p>
                      </div>
                      <a
                        href={currentSubmission.content}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 break-all underline"
                      >
                        {currentSubmission.content}
                      </a>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{currentSubmission.likes || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4" />
                      <span>{currentSubmission.shares || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{currentSubmission.votes || 0}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-500 hover:text-purple-600"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>

                {/* Swipe Buttons */}
                <div className="flex justify-center space-x-8">
                  <Button
                    onClick={() => handleSwipe("left")}
                    disabled={isAnimating}
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 rounded-full border-2 border-red-200 hover:border-red-400 hover:bg-red-50 transition-all"
                  >
                    <X className="w-8 h-8 text-red-500" />
                  </Button>

                  <Button
                    onClick={() => handleSwipe("right")}
                    disabled={isAnimating}
                    variant="outline"
                    size="lg"
                    className="w-16 h-16 rounded-full border-2 border-green-200 hover:border-green-400 hover:bg-green-50 transition-all"
                  >
                    <Heart className="w-8 h-8 text-green-500" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Swipe Instructions */}
        <div className="text-center mt-4 text-sm text-gray-500">
          <p>💡 Tip: Your swipes help determine trending content!</p>
          <p>Swipe cost: 0.001 ZORA • VP earned: 0.1 per swipe</p>
        </div>
      </div>
    </div>
  )
}
