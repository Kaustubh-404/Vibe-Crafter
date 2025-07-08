"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Heart, Share2, Clock, Vote, Crown, Star, TrendingUp } from "lucide-react"
import { useVibeStore } from "@/lib/store"
import type { VibeChallenge } from "@/lib/ai-trend-analyzer"
import { toast } from "@/hooks/use-toast"

export default function VotingScreen() {
  const [votingChallenges, setVotingChallenges] = useState<VibeChallenge[]>([])
  const [selectedChallenge, setSelectedChallenge] = useState<string>("")
  const [votedSubmissions, setVotedSubmissions] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<"votes" | "likes" | "recent">("votes")

  const { challenges, voteForSubmission, addVibePoints } = useVibeStore()

  useEffect(() => {
    const voting = challenges.filter((c) => c.status === "voting")
    setVotingChallenges(voting)
    if (voting.length > 0 && !selectedChallenge) {
      setSelectedChallenge(voting[0].id)
    }
  }, [challenges, selectedChallenge])

  const handleVote = async (submissionId: string) => {
    if (votedSubmissions.has(submissionId)) return

    try {
      await voteForSubmission(selectedChallenge, submissionId)
      setVotedSubmissions((prev) => new Set(prev).add(submissionId))

      toast({
        title: "Vote cast! 🗳️",
        description: "You'll earn 5 VP if this submission wins!",
      })
    } catch (error) {
      toast({
        title: "Vote failed",
        description: "Please try again.",
        variant: "destructive",
      })
    }
  }

  const getTimeRemaining = (endTime: Date) => {
    const now = new Date()
    const diff = endTime.getTime() - now.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  const selectedChallengeData = votingChallenges.find((c) => c.id === selectedChallenge)

  const getSortedSubmissions = () => {
    if (!selectedChallengeData?.submissions) return []

    const submissions = [...selectedChallengeData.submissions]

    switch (sortBy) {
      case "votes":
        return submissions.sort((a, b) => (b.votes || 0) - (a.votes || 0))
      case "likes":
        return submissions.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      case "recent":
        return submissions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      default:
        return submissions
    }
  }

  const shortlistedSubmissions = getSortedSubmissions().slice(0, 12) // Top 12 for voting

  if (votingChallenges.length === 0) {
    return (
      <div className="text-center py-12">
        <Card>
          <CardContent className="py-12">
            <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Voting</h3>
            <p className="text-gray-600 mb-4">
              Voting phases will appear here when challenges end their submission period.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg max-w-md mx-auto">
              <h4 className="font-medium text-blue-900 mb-2">How Voting Works</h4>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Vote for your favorite submissions</li>
                <li>• Earn 5 VP if your pick wins</li>
                <li>• Winners get tokenized as Zora Coins</li>
                <li>• Help decide what becomes tradeable</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vote for Winners</h2>
        <p className="text-gray-600">Choose the best submissions and earn 5 VP if your pick wins!</p>
      </div>

      {/* Challenge Selector */}
      {votingChallenges.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {votingChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedChallenge === challenge.id
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedChallenge(challenge.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-1">{challenge.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-orange-600 border-orange-200">
                        <Clock className="w-3 h-3 mr-1" />
                        {getTimeRemaining(new Date(challenge.endTime))}
                      </Badge>
                      <Badge variant="secondary">{challenge.submissions?.length || 0} submissions</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Voting Interface */}
      {selectedChallengeData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Top Submissions</span>
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-orange-600 border-orange-200">
                  <Clock className="w-4 h-4 mr-1" />
                  {getTimeRemaining(new Date(selectedChallengeData.endTime))} left
                </Badge>
              </div>
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2 mt-4">
              <span className="text-sm text-gray-600">Sort by:</span>
              {[
                { key: "votes" as const, label: "Most Votes", icon: Vote },
                { key: "likes" as const, label: "Most Liked", icon: Heart },
                { key: "recent" as const, label: "Recent", icon: Clock },
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={sortBy === key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSortBy(key)}
                  className="text-xs"
                >
                  <Icon className="w-3 h-3 mr-1" />
                  {label}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shortlistedSubmissions.map((submission, index) => (
                <Card key={submission.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="font-semibold text-gray-900 line-clamp-1">{submission.title}</h4>
                          {index < 3 && (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                              {index === 0 && <Crown className="w-3 h-3 mr-1" />}
                              {index === 1 && <Star className="w-3 h-3 mr-1" />}
                              {index === 2 && <TrendingUp className="w-3 h-3 mr-1" />}#{index + 1}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">by {submission.author}</p>
                      </div>
                    </div>

                    {/* Content Preview */}
                    <div className="mb-4">
                      {submission.type === "image" && (
                        <div className="relative">
                          {submission.content.includes("video") ||
                          submission.content.includes(".mp4") ||
                          submission.content.includes(".webm") ? (
                            <video
                              src={submission.content}
                              className="w-full h-32 object-cover rounded-lg"
                              muted
                              loop
                              onMouseEnter={(e) => e.currentTarget.play()}
                              onMouseLeave={(e) => e.currentTarget.pause()}
                            />
                          ) : (
                            <img
                              src={submission.content || "/placeholder.svg"}
                              alt={submission.title}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                        </div>
                      )}
                      {submission.type === "text" && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-800 line-clamp-3">{submission.content}</p>
                        </div>
                      )}
                      {submission.type === "link" && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <a
                            href={submission.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-800 break-all line-clamp-2"
                          >
                            {submission.content}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Stats and Vote Button */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Heart className="w-4 h-4" />
                            <span>{submission.likes || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Share2 className="w-4 h-4" />
                            <span>{submission.shares || 0}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Vote className="w-4 h-4" />
                            <span className="font-medium">{submission.votes || 0}</span>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleVote(submission.id)}
                        disabled={votedSubmissions.has(submission.id)}
                        variant={votedSubmissions.has(submission.id) ? "secondary" : "default"}
                        size="sm"
                        className={`w-full ${
                          votedSubmissions.has(submission.id)
                            ? "bg-green-100 text-green-700 hover:bg-green-100"
                            : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                        }`}
                      >
                        {votedSubmissions.has(submission.id) ? (
                          <>
                            <Trophy className="w-4 h-4 mr-1" />
                            Voted!
                          </>
                        ) : (
                          <>
                            <Vote className="w-4 h-4 mr-1" />
                            Vote (+5 VP if wins)
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {shortlistedSubmissions.length === 0 && (
              <div className="text-center py-8">
                <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No submissions have been shortlisted yet.</p>
              </div>
            )}

            {/* Voting Info */}
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg">
              <h4 className="font-medium text-purple-900 mb-2">Voting Rewards</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
                <div>
                  <p>• Vote for submissions you think should win</p>
                  <p>• Earn 5 VP if your choice becomes the winner</p>
                </div>
                <div>
                  <p>• Winners get tokenized as tradeable Zora Coins</p>
                  <p>• Help shape what content becomes valuable</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
