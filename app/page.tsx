"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Heart, Share2, TrendingUp, Zap, Trophy, User, Lock } from "lucide-react"
import VibeFeed from "@/components/vibe-feed"
import SubmissionScreen from "@/components/submission-screen"
import SwipeScreen from "@/components/swipe-screen"
import VotingScreen from "@/components/voting-screen"
import TradingScreen from "@/components/trading-screen"
import ProfileScreen from "@/components/profile-screen"
import ContentScreen from "@/components/content-screen"
import DeploymentStatus from "@/components/deployment-status"
import { useVibeStore } from "@/lib/store"
import { WalletProvider } from "@/components/wallet-provider"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("feed")
  const { user, vibePoints, initializeUser, connectWallet, isWalletConnected } = useVibeStore()

  useEffect(() => {
    initializeUser()
  }, [initializeUser])

  return (
    <WalletProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-purple-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  DeaVibeCrafter
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {!isWalletConnected && (
                  <button
                    onClick={connectWallet}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Connect Wallet
                  </button>
                )}
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  <Trophy className="w-4 h-4 mr-1" />
                  {vibePoints} VP
                </Badge>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.username?.[0]?.toUpperCase() || "U"}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Deployment Status
          <DeploymentStatus /> */}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6 mb-6">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="submit">Submit</TabsTrigger>
              <TabsTrigger value="swipe">Swipe</TabsTrigger>
              <TabsTrigger value="vote">Vote</TabsTrigger>
              <TabsTrigger value="trade">Trade</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <TabsContent value="feed">
              <VibeFeed />
            </TabsContent>

            <TabsContent value="submit">
              <SubmissionScreen />
            </TabsContent>

            <TabsContent value="swipe">
              <SwipeScreen />
            </TabsContent>

            <TabsContent value="vote">
              <VotingScreen />
            </TabsContent>

            <TabsContent value="trade">
              <TradingScreen />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileScreen />
            </TabsContent>

            <TabsContent value="content">
              <ContentScreen />
            </TabsContent>
          </Tabs>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-purple-200 px-4 py-2">
          <div className="max-w-4xl mx-auto flex justify-around">
            {[
              { id: "feed", icon: TrendingUp, label: "Feed" },
              { id: "submit", icon: Heart, label: "Submit" },
              { id: "swipe", icon: Share2, label: "Swipe" },
              { id: "vote", icon: Trophy, label: "Vote" },
              { id: "trade", icon: Zap, label: "Trade" },
              { id: "content", icon: Lock, label: "Content" },
              { id: "profile", icon: User, label: "Profile" },
            ].map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                  activeTab === id ? "text-purple-600 bg-purple-50" : "text-gray-500 hover:text-purple-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </WalletProvider>
  )
}
