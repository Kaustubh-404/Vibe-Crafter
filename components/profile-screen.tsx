"use client"

import { useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Trophy, Zap, Heart, Share2, TrendingUp, Award, Calendar, Users, Target, CheckCircle } from "lucide-react"
import { useVibeStore } from "@/lib/store"

export default function ProfileScreen() {
  const { 
    user, 
    vibePoints, 
    userStats, 
    challenges, 
    userHoldings, 
    loadUserStats, 
    isWalletConnected, 
    walletAddress 
  } = useVibeStore()

  useEffect(() => {
    loadUserStats()
  }, [loadUserStats])

  if (!user || !userStats) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-200 rounded-full animate-pulse mx-auto mb-4"></div>
          <div className="h-6 bg-gray-200 rounded w-48 mx-auto mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-32 mx-auto animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Calculate derived stats
  const totalSubmissions = challenges.flatMap(c => c.submissions || [])
    .filter(s => s.author === user.username).length

  const totalLikesReceived = challenges.flatMap(c => c.submissions || [])
    .filter(s => s.author === user.username)
    .reduce((sum, s) => sum + (s.likes || 0), 0)

  const totalVotesReceived = challenges.flatMap(c => c.submissions || [])
    .filter(s => s.author === user.username)
    .reduce((sum, s) => sum + (s.votes || 0), 0)

  const portfolioValue = Object.entries(userHoldings).reduce((total, [coinId, amount]) => {
    // Simplified portfolio calculation
    return total + (amount * 1.0) // Assuming 1.0 ZORA average price
  }, 0)

  const stats = [
    { 
      label: "Vibe Points", 
      value: vibePoints.toFixed(1), 
      icon: Zap, 
      color: "text-purple-600",
      bg: "bg-purple-100" 
    },
    { 
      label: "Submissions", 
      value: totalSubmissions, 
      icon: Heart, 
      color: "text-red-600",
      bg: "bg-red-100" 
    },
    { 
      label: "Votes Cast", 
      value: userStats.totalVotes, 
      icon: Trophy, 
      color: "text-yellow-600",
      bg: "bg-yellow-100" 
    },
    { 
      label: "Swipes", 
      value: userStats.totalSwipes, 
      icon: Share2, 
      color: "text-blue-600",
      bg: "bg-blue-100" 
    },
  ]

  const advancedStats = [
    { label: "Likes Received", value: totalLikesReceived, icon: Heart },
    { label: "Votes Received", value: totalVotesReceived, icon: Trophy },
    { label: "Winning Submissions", value: userStats.winningSubmissions, icon: TrendingUp },
    { label: "Portfolio Value", value: `${portfolioValue.toFixed(2)} ZORA`, icon: Zap },
    { label: "Current Rank", value: `#${userStats.rank}`, icon: Award },
  ]

  const recentActivity = [
    {
      type: "submission",
      description: "Submitted content to challenge",
      timestamp: "2 hours ago",
      points: "+5 VP",
      icon: Heart,
      color: "bg-purple-50 text-purple-600"
    },
    {
      type: "vote",
      description: "Voted for winning submission",
      timestamp: "1 day ago",
      points: "+5 VP",
      icon: Trophy,
      color: "bg-blue-50 text-blue-600"
    },
    {
      type: "swipe",
      description: "Swiped on 25 submissions",
      timestamp: "2 days ago",
      points: "+2.5 VP",
      icon: Share2,
      color: "bg-green-50 text-green-600"
    },
  ]

  const earnedAchievements = userStats.achievements.filter(a => a.earned)
  const inProgressAchievements = userStats.achievements.filter(a => !a.earned && a.progress !== undefined)

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="text-center py-6">
        <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4">
          {user.username[0]?.toUpperCase() || "U"}
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">{user.username}</h2>
        <p className="text-gray-600 mb-2">{user.farcasterHandle}</p>
        
        {/* Wallet Status */}
        <div className="flex items-center justify-center space-x-2 mb-4">
          {isWalletConnected ? (
            <Badge variant="default" className="bg-green-100 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Wallet Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              Wallet Not Connected
            </Badge>
          )}
        </div>

        {walletAddress && (
          <p className="text-xs text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        )}

        <div className="flex items-center justify-center space-x-4 mt-4">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Joined {new Date(userStats.joinDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Award className="w-4 h-4" />
            <span>Rank #{userStats.rank}</span>
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Advanced Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {advancedStats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <stat.icon className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">{stat.label}</span>
                </div>
                <span className="font-bold text-gray-900">{stat.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>Achievements ({earnedAchievements.length}/{userStats.achievements.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Earned Achievements */}
            {earnedAchievements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Unlocked</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {earnedAchievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-green-900">{achievement.name}</h4>
                        <p className="text-sm text-green-700">{achievement.description}</p>
                        {achievement.earnedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        Earned
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* In Progress Achievements */}
            {inProgressAchievements.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">In Progress</h4>
                <div className="space-y-3">
                  {inProgressAchievements.map((achievement) => {
                    const progressPercent = achievement.maxProgress 
                      ? ((achievement.progress || 0) / achievement.maxProgress) * 100 
                      : 0

                    return (
                      <div
                        key={achievement.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{achievement.name}</h4>
                          <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                          {achievement.maxProgress && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{achievement.progress || 0} / {achievement.maxProgress}</span>
                                <span>{Math.round(progressPercent)}%</span>
                              </div>
                              <Progress value={progressPercent} className="h-2" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Locked Achievements */}
            {userStats.achievements.filter(a => !a.earned && a.progress === undefined).length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Locked</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {userStats.achievements
                    .filter(a => !a.earned && a.progress === undefined)
                    .map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg opacity-60"
                      >
                        <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-600">{achievement.name}</h4>
                          <p className="text-sm text-gray-500">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className={`flex items-center space-x-3 p-3 ${activity.color} rounded-lg`}>
                <activity.icon className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium">{activity.description}</p>
                  <p className="text-sm opacity-75">{activity.timestamp}</p>
                </div>
                <Badge variant="outline" className="bg-white">
                  {activity.points}
                </Badge>
              </div>
            ))}

            {/* Show user's actual submissions if any */}
            {totalSubmissions > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900 mb-3">Your Submissions</h4>
                <div className="space-y-2">
                  {challenges
                    .flatMap(c => (c.submissions || []).map(s => ({ ...s, challengeTitle: c.title })))
                    .filter(s => s.author === user.username)
                    .slice(0, 5)
                    .map((submission) => (
                      <div key={submission.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <p className="font-medium text-sm">{submission.title}</p>
                          <p className="text-xs text-gray-600">{submission.challengeTitle}</p>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>{submission.likes || 0} likes</span>
                          <span>{submission.votes || 0} votes</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {recentActivity.length === 0 && totalSubmissions === 0 && (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity. Start creating vibes to build your profile!</p>
                <Button className="mt-4" onClick={() => window.location.hash = '#submit'}>
                  Create Your First Vibe
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Summary */}
      {Object.keys(userHoldings).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
                <span className="font-medium">Total Portfolio Value</span>
                <span className="font-bold text-lg">{portfolioValue.toFixed(3)} ZORA</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(userHoldings)
                  .filter(([_, amount]) => amount > 0)
                  .slice(0, 6)
                  .map(([coinId, amount]) => (
                    <div key={coinId} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium">
                        {coinId.replace('zora_', '').replace('real_', '').slice(0, 10)}...
                      </span>
                      <span className="text-sm font-bold">{amount.toFixed(3)}</span>
                    </div>
                  ))}
              </div>
              
              {Object.keys(userHoldings).length > 6 && (
                <p className="text-center text-sm text-gray-500">
                  +{Object.keys(userHoldings).length - 6} more holdings
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col items-center space-y-2 h-auto py-4"
              onClick={() => window.location.hash = '#submit'}
            >
              <Heart className="w-5 h-5" />
              <span className="text-sm">Submit Vibe</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center space-y-2 h-auto py-4"
              onClick={() => window.location.hash = '#swipe'}
            >
              <Share2 className="w-5 h-5" />
              <span className="text-sm">Swipe Vibes</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center space-y-2 h-auto py-4"
              onClick={() => window.location.hash = '#vote'}
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm">Vote</span>
            </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col items-center space-y-2 h-auto py-4"
              onClick={() => window.location.hash = '#trade'}
            >
              <Zap className="w-5 h-5" />
              <span className="text-sm">Trade</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}