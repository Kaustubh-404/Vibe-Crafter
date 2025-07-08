"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Heart, Share2, DollarSign, Lock, Unlock, Play } from "lucide-react"
import { useVibeStore } from "@/lib/store"
import { blockchainService } from "@/lib/blockchain"
import { toast } from "@/hooks/use-toast"

interface ExclusiveContent {
  id: string
  title: string
  description: string
  type: "video" | "article" | "podcast" | "course"
  tokenId: number
  requiredTokens: number
  creator: string
  duration?: string
  thumbnail: string
  contentUrl: string
  likes: number
  shares: number
}

export default function ContentScreen() {
  const [exclusiveContent, setExclusiveContent] = useState<ExclusiveContent[]>([])
  const [userAccess, setUserAccess] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const { user, isWalletConnected } = useVibeStore()

  useEffect(() => {
    loadExclusiveContent()
  }, [])

  useEffect(() => {
    if (isWalletConnected) {
      checkUserAccess()
    }
  }, [isWalletConnected, exclusiveContent])

  const loadExclusiveContent = async () => {
    setLoading(true)
    try {
      // In a real implementation, this would fetch from your API
      const mockContent: ExclusiveContent[] = [
        {
          id: "content_1",
          title: "Dogecoin 2025 Trend Analysis",
          description: "Deep dive into Dogecoin's market movements and future predictions",
          type: "video",
          tokenId: 1,
          requiredTokens: 0.1,
          creator: "CryptoAnalyst",
          duration: "15:30",
          thumbnail: "/placeholder.svg?height=200&width=300",
          contentUrl: "https://example.com/video1",
          likes: 234,
          shares: 45,
        },
        {
          id: "content_2",
          title: "DeFi Strategy Masterclass",
          description: "Learn advanced DeFi strategies from industry experts",
          type: "course",
          tokenId: 2,
          requiredTokens: 0.5,
          creator: "DeFiGuru",
          duration: "2h 30m",
          thumbnail: "/placeholder.svg?height=200&width=300",
          contentUrl: "https://example.com/course1",
          likes: 567,
          shares: 89,
        },
        {
          id: "content_3",
          title: "NFT Market Insights",
          description: "Exclusive insights into the NFT market trends and opportunities",
          type: "article",
          tokenId: 3,
          requiredTokens: 0.2,
          creator: "NFTExpert",
          thumbnail: "/placeholder.svg?height=200&width=300",
          contentUrl: "https://example.com/article1",
          likes: 123,
          shares: 34,
        },
      ]

      setExclusiveContent(mockContent)
    } catch (error) {
      console.error("Failed to load exclusive content:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkUserAccess = async () => {
    if (!isWalletConnected) return

    try {
      const userAddress = await blockchainService.getAddress()
      if (!userAddress) return

      const accessMap: Record<string, boolean> = {}

      for (const content of exclusiveContent) {
        const hasAccess = await blockchainService.checkAccess(userAddress, content.tokenId)
        accessMap[content.id] = hasAccess
      }

      setUserAccess(accessMap)
    } catch (error) {
      console.error("Failed to check user access:", error)
    }
  }

  const purchaseAccess = async (content: ExclusiveContent) => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to purchase access.",
        variant: "destructive",
      })
      return
    }

    try {
      const price = (content.requiredTokens * 0.1).toString() // 0.1 token price for access
      await blockchainService.purchaseAccess(content.tokenId, price)

      // Update access status
      setUserAccess((prev) => ({
        ...prev,
        [content.id]: true,
      }))

      toast({
        title: "Access purchased! 🎉",
        description: `You now have access to "${content.title}"`,
      })
    } catch (error) {
      console.error("Failed to purchase access:", error)
      toast({
        title: "Purchase failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleLike = async (contentId: string) => {
    // Simulate liking content
    setExclusiveContent((prev) =>
      prev.map((content) => (content.id === contentId ? { ...content, likes: content.likes + 1 } : content)),
    )

    toast({
      title: "Liked! ❤️",
      description: "Thanks for your engagement!",
    })
  }

  const handleShare = async (content: ExclusiveContent) => {
    // Simulate sharing to Farcaster
    const shareText = `Check out this exclusive content: "${content.title}" on DeaVibeCrafter! 🚀`

    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: shareText,
          url: window.location.href,
        })
      } catch (error) {
        console.log("Share cancelled")
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareText)
      toast({
        title: "Copied to clipboard! 📋",
        description: "Share this on Farcaster to spread the vibe!",
      })
    }

    // Update share count
    setExclusiveContent((prev) => prev.map((c) => (c.id === content.id ? { ...c, shares: c.shares + 1 } : c)))
  }

  const handleTip = async (content: ExclusiveContent) => {
    if (!isWalletConnected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to tip creators.",
        variant: "destructive",
      })
      return
    }

    // Simulate tipping 0.1 ZORA
    toast({
      title: "Tip sent! 💰",
      description: `Tipped 0.1 ZORA to ${content.creator}`,
    })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Exclusive Content</h2>
        <p className="text-gray-600">Premium content unlocked by holding Zora Coins</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exclusiveContent.map((content) => {
          const hasAccess = userAccess[content.id]

          return (
            <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative">
                <img
                  src={content.thumbnail || "/placeholder.svg"}
                  alt={content.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant={hasAccess ? "default" : "secondary"}>
                    {hasAccess ? (
                      <>
                        <Unlock className="w-3 h-3 mr-1" />
                        Unlocked
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 mr-1" />
                        Locked
                      </>
                    )}
                  </Badge>
                </div>
                {content.duration && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                    {content.duration}
                  </div>
                )}
              </div>

              <CardHeader>
                <CardTitle className="text-lg">{content.title}</CardTitle>
                <p className="text-sm text-gray-600">{content.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>by {content.creator}</span>
                  <Badge variant="outline">{content.type}</Badge>
                </div>
              </CardHeader>

              <CardContent>
                {hasAccess ? (
                  <div className="space-y-4">
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700">
                      <Play className="w-4 h-4 mr-2" />
                      Access Content
                    </Button>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLike(content.id)}
                          className="text-gray-600 hover:text-red-500"
                        >
                          <Heart className="w-4 h-4 mr-1" />
                          {content.likes}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(content)}
                          className="text-gray-600 hover:text-blue-500"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          {content.shares}
                        </Button>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTip(content)}
                        className="text-green-600 border-green-200 hover:bg-green-50"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Tip 0.1 ZORA
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 mb-2">Hold {content.requiredTokens} tokens to unlock</p>
                      <p className="text-sm text-gray-500">
                        Or purchase access for {(content.requiredTokens * 0.1).toFixed(1)} ZORA
                      </p>
                    </div>

                    <Button
                      onClick={() => purchaseAccess(content)}
                      disabled={!isWalletConnected}
                      className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                    >
                      {isWalletConnected ? "Purchase Access" : "Connect Wallet"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {exclusiveContent.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Exclusive Content</h3>
            <p className="text-gray-600">Exclusive content will appear here when challenges are completed!</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
