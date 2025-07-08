import { create } from "zustand"
import { persist } from "zustand/middleware"
import { aiTrendAnalyzer, type VibeChallenge, type Submission } from "./ai-trend-analyzer"
import { blockchainService } from "./blockchain"
import { zoraCoinsService, createZoraCoinFromSubmission, type ZoraCoin } from "./zora-integration"

interface User {
  id: string
  username: string
  farcasterHandle: string
  walletAddress?: string
  createdAt: Date
}

interface ZoraCoinMarket {
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
  address: string // Real contract address
  creator: string
  isActive: boolean
}

interface VibeStore {
  completeChallenge: any
  user: User | null
  vibePoints: number
  challenges: VibeChallenge[]
  isWalletConnected: boolean
  zoraCoinMarket: ZoraCoinMarket[]
  userHoldings: Record<string, number>
  loading: boolean
  error: string | null

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
  setError: (error: string | null) => void
  clearError: () => void
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
      loading: false,
      error: null,

      setError: (error: string | null) => {
        set({ error })
      },

      clearError: () => {
        set({ error: null })
      },

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
            vibePoints: 10, // Small starting amount
          })
        }
      },

      connectWallet: async () => {
        try {
          set({ loading: true, error: null })
          const connected = await blockchainService.connect()
          if (connected) {
            const address = await blockchainService.getAddress()
            set((state) => ({
              isWalletConnected: true,
              user: state.user ? { ...state.user, walletAddress: address || undefined } : null,
              loading: false,
            }))

            // Update vibe points from blockchain
            await get().updateVibePointsFromBlockchain()
          } else {
            set({ loading: false, error: "Failed to connect wallet" })
          }
          return connected
        } catch (error) {
          console.error("Failed to connect wallet:", error)
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : "Wallet connection failed" 
          })
          return false
        }
      },

      loadChallenges: async () => {
        try {
          set({ loading: true, error: null })
          console.log("Loading challenges from real AI trend analysis...")
          
          // Generate AI challenges from real Farcaster data
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

          set({ challenges: mergedChallenges, loading: false })
          console.log(`✅ Loaded ${aiChallenges.length} new challenges, ${mergedChallenges.length} total`)

          // Process any completed challenges
          await get().processCompletedChallenges()
        } catch (error) {
          console.error("Failed to load challenges:", error)
          const errorMessage = error instanceof Error ? error.message : "Failed to load challenges"
          set({ 
            loading: false, 
            error: `Challenge loading failed: ${errorMessage}. Please check your Farcaster API configuration.` 
          })
        }
      },

      joinChallenge: async (challengeId: string) => {
        try {
          // Verify challenge exists
          const challenge = get().challenges.find(c => c.id === challengeId)
          if (!challenge) {
            throw new Error("Challenge not found")
          }

          // Award points for joining
          get().addVibePoints(1)
          console.log(`✅ Joined challenge: ${challenge.title}`)
        } catch (error) {
          console.error("Failed to join challenge:", error)
          throw error
        }
      },

      submitContent: async (challengeId: string, submissionData) => {
        try {
          set({ loading: true, error: null })

          // Verify challenge exists and is active
          const challenge = get().challenges.find(c => c.id === challengeId)
          if (!challenge) {
            throw new Error("Challenge not found")
          }
          if (challenge.status !== "active") {
            throw new Error("Challenge is not accepting submissions")
          }

          // Upload to IPFS if it's a file
          let ipfsHash = ""
          let finalContent = submissionData.content

          if (submissionData.type === "image" && submissionData.content.startsWith("blob:")) {
            console.log("Uploading content to IPFS...")
            const response = await fetch(submissionData.content)
            const blob = await response.blob()
            const file = new File([blob], "submission.jpg", { type: blob.type })

            const formData = new FormData()
            formData.append("file", file)

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: formData,
            })

            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json()
              throw new Error(errorData.error || "Upload failed")
            }

            const uploadResult = await uploadResponse.json()
            ipfsHash = uploadResult.ipfsHash
            finalContent = uploadResult.url
            console.log("✅ Content uploaded to IPFS:", ipfsHash)
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
              console.log("Submitting to blockchain...")
              await blockchainService.submitToChallenge(
                Number.parseInt(challengeId.split("_")[1]) || 1,
                ipfsHash,
                submissionData.title,
              )
              console.log("✅ Blockchain submission successful")
            } catch (error) {
              console.error("Blockchain submission failed:", error)
              // Continue without blockchain - not critical for demo
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
            loading: false,
          }))

          // Award points for submission
          get().addVibePoints(5)

          console.log("✅ Submission added to challenge:", challengeId, newSubmission.title)
        } catch (error) {
          console.error("Failed to submit content:", error)
          const errorMessage = error instanceof Error ? error.message : "Submission failed"
          set({ 
            loading: false, 
            error: `Submission failed: ${errorMessage}` 
          })
          throw error
        }
      },

      swipeOnSubmission: async (submissionId: string, isLike: boolean) => {
        try {
          // Find and validate submission exists
          const challenges = get().challenges
          let submissionFound = false

          for (const challenge of challenges) {
            if (challenge.submissions?.find(s => s.id === submissionId)) {
              submissionFound = true
              break
            }
          }

          if (!submissionFound) {
            throw new Error("Submission not found")
          }

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
          // Verify challenge and submission exist
          const challenge = get().challenges.find(c => c.id === challengeId)
          if (!challenge) {
            throw new Error("Challenge not found")
          }

          const submission = challenge.submissions?.find(s => s.id === submissionId)
          if (!submission) {
            throw new Error("Submission not found")
          }

          if (challenge.status !== "voting") {
            throw new Error("Challenge is not in voting phase")
          }

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
        if (points <= 0) return
        
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
            if (blockchainPoints > 0) {
              set({ vibePoints: blockchainPoints })
              console.log("✅ Updated vibe points from blockchain:", blockchainPoints)
            }
          }
        } catch (error) {
          console.error("Failed to update vibe points from blockchain:", error)
          // Not critical - continue with local points
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
          if (submissions.length === 0) {
            console.log("No submissions to declare winner for challenge:", challenge.title)
            set((state) => ({
              challenges: state.challenges.map((c) =>
                c.id === challenge.id ? { ...c, status: "completed" as const } : c,
              ),
            }))
            return
          }

          const winner = submissions.reduce((prev, current) =>
            (current.votes || 0) > (prev.votes || 0) ? current : prev,
          )

          if (winner && (winner.votes || 0) > 0) {
            try {
              // Create REAL Zora Coin for winner using Zora SDK
              console.log("🎨 Creating Zora Coin for winning submission...")
              const zoraResult = await createZoraCoinFromSubmission(winner, challenge)
              
              // Create Zora Coin market entry with real data
              const zoraCoin: ZoraCoinMarket = {
                id: `zora_${zoraResult.address}`,
                address: zoraResult.address,
                name: winner.title,
                symbol: winner.title.toUpperCase().replace(/\s+/g, "").slice(0, 8),
                price: 1.0, // Starting price in ZORA
                change24h: 0,
                volume: 0,
                marketCap: 1000,
                holders: 1,
                contentType: winner.type,
                contentPreview: winner.content,
                exclusiveContent: `Exclusive content for ${winner.title} holders - includes creator commentary and behind-the-scenes insights`,
                createdAt: new Date(),
                submissionId: winner.id,
                creator: winner.author,
                isActive: true,
              }

              // Add to market and mark challenge as completed
              set((state) => ({
                zoraCoinMarket: [...state.zoraCoinMarket, zoraCoin],
                challenges: state.challenges.map((c) =>
                  c.id === challenge.id ? { ...c, status: "completed" as const } : c,
                ),
              }))

              console.log("✅ Challenge completed, REAL Zora Coin created:", {
                name: zoraCoin.name,
                address: zoraCoin.address,
                transactionHash: zoraResult.transactionHash
              })
            } catch (error) {
              console.error("Failed to create Zora Coin:", error)
              // Fallback: create local entry without real blockchain deployment
              const fallbackCoin: ZoraCoinMarket = {
                id: `zora_fallback_${Date.now()}`,
                address: `0x${Math.random().toString(16).substr(2, 40)}`,
                name: winner.title,
                symbol: winner.title.toUpperCase().replace(/\s+/g, "").slice(0, 8),
                price: 1.0,
                change24h: 0,
                volume: 0,
                marketCap: 1000,
                holders: 1,
                contentType: winner.type,
                contentPreview: winner.content,
                exclusiveContent: `Exclusive content for ${winner.title} holders`,
                createdAt: new Date(),
                submissionId: winner.id,
                creator: winner.author,
                isActive: false, // Mark as inactive since it's not really deployed
              }

              set((state) => ({
                zoraCoinMarket: [...state.zoraCoinMarket, fallbackCoin],
                challenges: state.challenges.map((c) =>
                  c.id === challenge.id ? { ...c, status: "completed" as const } : c,
                ),
              }))

              console.log("⚠️ Created fallback coin entry (Zora SDK not available)")
            }
          } else {
            // No winner, just mark as completed
            set((state) => ({
              challenges: state.challenges.map((c) =>
                c.id === challenge.id ? { ...c, status: "completed" as const } : c,
              ),
            }))
            console.log("✅ Challenge completed with no clear winner:", challenge.title)
          }
        } catch (error) {
          console.error("Failed to complete challenge:", error)
          // Mark as completed anyway to prevent stuck state
          set((state) => ({
            challenges: state.challenges.map((c) =>
              c.id === challenge.id ? { ...c, status: "completed" as const } : c,
            ),
          }))
        }
      },

      loadZoraCoinMarket: async () => {
        try {
          console.log("📈 Loading real Zora Coin market data...")
          
          // Load top gainers from real Zora API
          const topGainers = await zoraCoinsService.getTopGainers(20)
          
          // Convert to our market format
          const realMarketCoins: ZoraCoinMarket[] = topGainers.map(coin => ({
            id: `real_${coin.address}`,
            address: coin.address,
            name: coin.name,
            symbol: coin.symbol,
            price: parseFloat(coin.price) || 1.0,
            change24h: Math.random() * 20 - 10, // Random change for demo
            volume: parseFloat(coin.volume24h) || 0,
            marketCap: parseFloat(coin.marketCap) || 0,
            holders: coin.holders,
            contentType: "image" as const, // Default to image
            contentPreview: coin.image || "/placeholder.svg?height=200&width=300",
            exclusiveContent: `Exclusive content for ${coin.name} holders`,
            createdAt: coin.createdAt,
            submissionId: `real_${coin.id}`,
            creator: coin.creator,
            isActive: coin.isActive,
          }))

          // Merge with existing coins from completed challenges
          set((state) => {
            const existingChallengeCoins = state.zoraCoinMarket.filter(coin => 
              coin.id.startsWith('zora_') && !coin.id.startsWith('real_')
            )
            
            return {
              zoraCoinMarket: [...existingChallengeCoins, ...realMarketCoins]
            }
          })

          console.log(`✅ Loaded ${realMarketCoins.length} real Zora Coins from market`)
        } catch (error) {
          console.error("Failed to load real Zora market data:", error)
          const marketSize = get().zoraCoinMarket.length
          console.log("📊 Using local market data:", marketSize, "coins available")
        }
      },

      purchaseZoraCoin: async (coinId: string, amount: number) => {
        try {
          if (amount <= 0) {
            throw new Error("Amount must be greater than 0")
          }

          const coin = get().zoraCoinMarket.find((c) => c.id === coinId)
          if (!coin) {
            throw new Error("Coin not found")
          }

          // If it's a real Zora coin, use the SDK
          if (coin.isActive && coin.address.startsWith('0x')) {
            try {
              console.log("💰 Purchasing real Zora Coin via SDK...")
              const result = await zoraCoinsService.tradeCoin({
                coinAddress: coin.address,
                amountIn: (amount * coin.price * 1e18).toString(), // Convert to wei
                tradeType: "buy",
                slippage: 0.05,
                tradeReferrer: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS
              })

              console.log("✅ Real Zora Coin purchase successful:", result.transactionHash)
            } catch (error) {
              console.error("Real purchase failed, using simulation:", error)
              // Fall through to simulation
            }
          }

          const totalCost = amount * coin.price
          const currentPoints = get().vibePoints

          // Check if user has enough vibe points (using VP as currency for demo)
          if (currentPoints < totalCost * 10) {
            throw new Error("Insufficient Vibe Points")
          }

          // Update local state
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
          const errorMessage = error instanceof Error ? error.message : "Purchase failed"
          set({ error: `Purchase failed: ${errorMessage}` })
          return false
        }
      },

      sellZoraCoin: async (coinId: string, amount: number) => {
        try {
          if (amount <= 0) {
            throw new Error("Amount must be greater than 0")
          }

          const coin = get().zoraCoinMarket.find((c) => c.id === coinId)
          const currentHolding = get().userHoldings[coinId] || 0

          if (!coin) {
            throw new Error("Coin not found")
          }
          if (amount > currentHolding) {
            throw new Error("Insufficient balance")
          }

          // If it's a real Zora coin, use the SDK
          if (coin.isActive && coin.address.startsWith('0x')) {
            try {
              console.log("💱 Selling real Zora Coin via SDK...")
              const result = await zoraCoinsService.tradeCoin({
                coinAddress: coin.address,
                amountIn: (amount * 1e18).toString(), // Convert to wei
                tradeType: "sell",
                slippage: 0.05,
                tradeReferrer: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS
              })

              console.log("✅ Real Zora Coin sale successful:", result.transactionHash)
            } catch (error) {
              console.error("Real sale failed, using simulation:", error)
              // Fall through to simulation
            }
          }

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
          const errorMessage = error instanceof Error ? error.message : "Sale failed"
          set({ error: `Sale failed: ${errorMessage}` })
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