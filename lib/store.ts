"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { aiTrendAnalyzer, type VibeChallenge, type Submission } from "./ai-trend-analyzer"
import { blockchainService } from "./blockchain"

interface User {
  id: string
  username: string
  farcasterHandle: string
  walletAddress?: string
  createdAt: Date
}

interface ZoraCoin {
  id: string
  name: string
  symbol: string
  price: number
  change24h: number
  volume: number
  marketCap: number
  holders: number
  contentType: "image" | "text" | "link"
  contentPreview: string
  exclusiveContent?: string
  createdAt: Date
  submissionId: string
}

interface VibeStore {
  user: User | null
  vibePoints: number
  challenges: VibeChallenge[]
  isWalletConnected: boolean
  zoraCoinMarket: ZoraCoin[]
  userHoldings: Record<string, number>

  // Actions
  initializeUser: () => void
  connectWallet: () => Promise<boolean>
  loadChallenges: () => Promise<void>
  joinChallenge: (challengeId: string) => Promise<void>
  submitContent: (
    challengeId: string,
    submission: Omit<Submission, "id" | "createdAt" | "likes" | "shares" | "votes">,
  ) => Promise<void>
  swipeOnSubmission: (submissionId: string, isLike: boolean) => Promise<void>
  voteForSubmission: (challengeId: string, submissionId: string) => Promise<void>
  addVibePoints: (points: number) => void
  updateVibePointsFromBlockchain: () => Promise<void>
  processCompletedChallenges: () => Promise<void>
  loadZoraCoinMarket: () => Promise<void>
  purchaseZoraCoin: (coinId: string, amount: number) => Promise<boolean>
  sellZoraCoin: (coinId: string, amount: number) => Promise<boolean>
}

export const useVibeStore = create<VibeStore>()(
  persist(
    (set, get) => ({
      user: null,
      vibePoints: 0,
      challenges: [],
      isWalletConnected: false,
      zoraCoinMarket: [],
      userHoldings: {},

      initializeUser: () => {
        const currentUser = get().user
        if (!currentUser) {
          set({
            user: {
              id: `user_${Date.now()}`,
              username: `viber_${Math.random().toString(36).substr(2, 6)}`,
              farcasterHandle: `@viber_${Math.random().toString(36).substr(2, 6)}`,
              createdAt: new Date(),
            },
            vibePoints: 100, // Starting points
          })
        }
      },

      connectWallet: async () => {
        try {
          const connected = await blockchainService.connect()
          if (connected) {
            const address = await blockchainService.getAddress()
            set((state) => ({
              isWalletConnected: true,
              user: state.user ? { ...state.user, walletAddress: address || undefined } : null,
            }))

            // Update vibe points from blockchain
            await get().updateVibePointsFromBlockchain()
          }
          return connected
        } catch (error) {
          console.error("Failed to connect wallet:", error)
          return false
        }
      },

      loadChallenges: async () => {
        try {
          // Generate AI challenges
          const aiChallenges = await aiTrendAnalyzer.generateDailyChallenges()

          // Load existing challenges from state and merge with new ones
          const existingChallenges = get().challenges
          const mergedChallenges = [...existingChallenges]

          // Add new AI challenges if they don't exist
          aiChallenges.forEach((newChallenge) => {
            const exists = existingChallenges.find((c) => c.title === newChallenge.title)
            if (!exists) {
              mergedChallenges.push(newChallenge)
            }
          })

          set({ challenges: mergedChallenges })

          // Process any completed challenges
          await get().processCompletedChallenges()
        } catch (error) {
          console.error("Failed to load challenges:", error)
        }
      },

      joinChallenge: async (challengeId: string) => {
        // Award points for joining
        get().addVibePoints(1)
      },

      submitContent: async (challengeId: string, submissionData) => {
        try {
          // Upload to IPFS first if it's a blob URL
          let ipfsHash = ""
          let finalContent = submissionData.content

          if (submissionData.type === "image" && submissionData.content.startsWith("blob:")) {
            const response = await fetch(submissionData.content)
            const blob = await response.blob()
            const file = new File([blob], "submission.jpg", { type: blob.type })

            const formData = new FormData()
            formData.append("file", file)

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (uploadResponse.ok) {
              const uploadResult = await uploadResponse.json()
              ipfsHash = uploadResult.ipfsHash
              finalContent = uploadResult.url
            }
          }

          const newSubmission: Submission = {
            ...submissionData,
            content: finalContent,
            id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            challengeId,
            createdAt: new Date(),
            likes: 0,
            shares: 0,
            votes: 0,
            ipfsHash,
          }

          // Submit to blockchain if connected
          if (get().isWalletConnected && ipfsHash) {
            try {
              await blockchainService.submitToChallenge(
                Number.parseInt(challengeId.split("_")[1]) || 1,
                ipfsHash,
                submissionData.title,
              )
            } catch (error) {
              console.error("Blockchain submission failed:", error)
            }
          }

          // Add submission to challenge
          set((state) => ({
            challenges: state.challenges.map((challenge) =>
              challenge.id === challengeId
                ? {
                    ...challenge,
                    submissions: [...(challenge.submissions || []), newSubmission],
                  }
                : challenge,
            ),
          }))

          // Award points for submission
          get().addVibePoints(5)

          console.log("✅ Submission added to challenge:", challengeId, newSubmission)
        } catch (error) {
          console.error("Failed to submit content:", error)
          throw error
        }
      },

      swipeOnSubmission: async (submissionId: string, isLike: boolean) => {
        try {
          // Update submission likes across all challenges
          set((state) => ({
            challenges: state.challenges.map((challenge) => ({
              ...challenge,
              submissions: challenge.submissions?.map((submission) =>
                submission.id === submissionId
                  ? {
                      ...submission,
                      likes: isLike ? (submission.likes || 0) + 1 : submission.likes,
                    }
                  : submission,
              ),
            })),
          }))

          // Award VP for swipe
          get().addVibePoints(0.1)

          console.log("✅ Swipe processed:", submissionId, isLike ? "liked" : "passed")
        } catch (error) {
          console.error("Failed to swipe on submission:", error)
          throw error
        }
      },

      voteForSubmission: async (challengeId: string, submissionId: string) => {
        try {
          // Update submission votes
          set((state) => ({
            challenges: state.challenges.map((challenge) =>
              challenge.id === challengeId
                ? {
                    ...challenge,
                    submissions: challenge.submissions?.map((submission) =>
                      submission.id === submissionId
                        ? { ...submission, votes: (submission.votes || 0) + 1 }
                        : submission,
                    ),
                  }
                : challenge,
            ),
          }))

          console.log("✅ Vote cast:", challengeId, submissionId)
        } catch (error) {
          console.error("Failed to vote for submission:", error)
          throw error
        }
      },

      addVibePoints: (points: number) => {
        set((state) => ({
          vibePoints: state.vibePoints + points,
        }))
      },

      updateVibePointsFromBlockchain: async () => {
        if (!get().isWalletConnected) return

        try {
          const userAddress = await blockchainService.getAddress()
          if (userAddress) {
            const blockchainPoints = await blockchainService.getUserVibePoints(userAddress)
            set({ vibePoints: blockchainPoints })
          }
        } catch (error) {
          console.error("Failed to update vibe points from blockchain:", error)
        }
      },

      processCompletedChallenges: async () => {
        const now = new Date()
        const challenges = get().challenges

        // Find challenges that should move to voting phase
        const challengesToUpdate = challenges.filter(
          (challenge) => challenge.status === "active" && new Date(challenge.endTime) <= now,
        )

        if (challengesToUpdate.length > 0) {
          set((state) => ({
            challenges: state.challenges.map((challenge) => {
              if (challengesToUpdate.find((c) => c.id === challenge.id)) {
                return { ...challenge, status: "voting" as const }
              }
              return challenge
            }),
          }))

          console.log("✅ Moved challenges to voting phase:", challengesToUpdate.length)
        }

        // Find challenges that should be completed (voting ended)
        const votingEndedChallenges = challenges.filter(
          (challenge) =>
            challenge.status === "voting" &&
            new Date(challenge.endTime).getTime() + 12 * 60 * 60 * 1000 <= now.getTime(),
        )

        for (const challenge of votingEndedChallenges) {
          await get().completeChallenge(challenge)
        }
      },

      completeChallenge: async (challenge: VibeChallenge) => {
        try {
          // Find winner (submission with most votes)
          const submissions = challenge.submissions || []
          const winner = submissions.reduce((prev, current) =>
            (current.votes || 0) > (prev.votes || 0) ? current : prev,
          )

          if (winner && (winner.votes || 0) > 0) {
            // Create Zora Coin for winner
            const zoraCoin: ZoraCoin = {
              id: `zora_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
              name: winner.title,
              symbol: winner.title.toUpperCase().replace(/\s+/g, "").slice(0, 8),
              price: 1.0, // Starting price
              change24h: 0,
              volume: 0,
              marketCap: 1000,
              holders: 1,
              contentType: winner.type,
              contentPreview: winner.content,
              exclusiveContent: `Exclusive content for ${winner.title} holders`,
              createdAt: new Date(),
              submissionId: winner.id,
            }

            // Add to market
            set((state) => ({
              zoraCoinMarket: [...state.zoraCoinMarket, zoraCoin],
              challenges: state.challenges.map((c) =>
                c.id === challenge.id ? { ...c, status: "completed" as const } : c,
              ),
            }))

            console.log("✅ Challenge completed, Zora Coin created:", zoraCoin)
          }
        } catch (error) {
          console.error("Failed to complete challenge:", error)
        }
      },

      loadZoraCoinMarket: async () => {
        // Market data is managed in state, no external loading needed
        console.log("✅ Zora Coin market loaded:", get().zoraCoinMarket.length, "coins")
      },

      purchaseZoraCoin: async (coinId: string, amount: number) => {
        try {
          const coin = get().zoraCoinMarket.find((c) => c.id === coinId)
          if (!coin) throw new Error("Coin not found")

          const totalCost = amount * coin.price

          // Simulate purchase (in real app, this would interact with Uniswap)
          set((state) => ({
            userHoldings: {
              ...state.userHoldings,
              [coinId]: (state.userHoldings[coinId] || 0) + amount,
            },
            vibePoints: state.vibePoints - totalCost * 10, // Convert ZORA to VP for demo
          }))

          console.log("✅ Purchased Zora Coin:", amount, coin.symbol)
          return true
        } catch (error) {
          console.error("Failed to purchase Zora Coin:", error)
          return false
        }
      },

      sellZoraCoin: async (coinId: string, amount: number) => {
        try {
          const coin = get().zoraCoinMarket.find((c) => c.id === coinId)
          const currentHolding = get().userHoldings[coinId] || 0

          if (!coin) throw new Error("Coin not found")
          if (amount > currentHolding) throw new Error("Insufficient balance")

          const totalValue = amount * coin.price

          set((state) => ({
            userHoldings: {
              ...state.userHoldings,
              [coinId]: state.userHoldings[coinId] - amount,
            },
            vibePoints: state.vibePoints + totalValue * 10, // Convert ZORA to VP for demo
          }))

          console.log("✅ Sold Zora Coin:", amount, coin.symbol)
          return true
        } catch (error) {
          console.error("Failed to sell Zora Coin:", error)
          return false
        }
      },
    }),
    {
      name: "vibe-store",
      partialize: (state) => ({
        user: state.user,
        vibePoints: state.vibePoints,
        challenges: state.challenges,
        zoraCoinMarket: state.zoraCoinMarket,
        userHoldings: state.userHoldings,
      }),
    },
  ),
)
