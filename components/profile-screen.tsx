"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Zap, Heart, Share2, TrendingUp, Award } from "lucide-react"
import { useVibeStore } from "@/lib/store"

export default function ProfileScreen() {
  const { user, vibePoints } = useVibeStore()

  const achievements = [
    { id: 1, name: "First Vibe", description: "Submit your first vibe", icon: Heart, earned: true },
    { id: 2, name: "Swipe Master", description: "Swipe on 100 submissions", icon: Share2, earned: true },
    { id: 3, name: "Vibe Legend", description: "Get 1000+ likes on a submission", icon: Trophy, earned: false },
    { id: 4, name: "Trend Setter", description: "Create a viral vibe", icon: TrendingUp, earned: false },
  ]

  const stats = [
    { label: "Vibe Points", value: vibePoints, icon: Zap },
    { label: "Submissions", value: 12, icon: Heart },
    { label: "Votes Cast", value: 45, icon: Trophy },
    { label: "Swipes", value: 234, icon: Share2 },
  ]

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
          {user?.username?.[0]?.toUpperCase() || "U"}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{user?.username || "Anonymous"}</h2>
        <p className="text-gray-600">Vibe Creator & Curator</p>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <stat.icon className="w-6 h-6 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.label}</p>
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
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  achievement.earned ? "bg-green-50 border border-green-200" : "bg-gray-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    achievement.earned ? "bg-green-100" : "bg-gray-200"
                  }`}
                >
                  <achievement.icon className={`w-5 h-5 ${achievement.earned ? "text-green-600" : "text-gray-400"}`} />
                </div>
                <div className="flex-1">
                  <h4 className={`font-semibold ${achievement.earned ? "text-green-900" : "text-gray-600"}`}>
                    {achievement.name}
                  </h4>
                  <p className={`text-sm ${achievement.earned ? "text-green-700" : "text-gray-500"}`}>
                    {achievement.description}
                  </p>
                </div>
                {achievement.earned && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Earned
                  </Badge>
                )}
              </div>
            ))}
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
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <Heart className="w-5 h-5 text-purple-600" />
              <div>
                <p className="font-medium text-gray-900">Submitted "Dogecoin Moon Meme"</p>
                <p className="text-sm text-gray-600">2 hours ago • 45 likes</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Trophy className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-gray-900">Voted for winning submission</p>
                <p className="text-sm text-gray-600">1 day ago • +5 VP earned</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Share2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">Swiped on 25 submissions</p>
                <p className="text-sm text-gray-600">2 days ago • +2.5 VP earned</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
