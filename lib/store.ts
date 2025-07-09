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
  address: string
  creator: string
  isActive: boolean
}

interface UserStats {
  totalSubmissions: number
  totalVotes: number
  totalSwipes: number
  totalShares: number
  winningSubmissions: number
  rank: number
  joinDate: Date
  achievements: Achievement[]
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  earned: boolean
  earnedAt?: Date
  progress?: number
  maxProgress?: number
}

interface VibeStore {
  // State
  user: User | null
  vibePoints: number
  challenges: VibeChallenge[]
  isWalletConnected: boolean
  walletAddress: string | null
  zoraCoinMarket: ZoraCoinMarket[]
  userHoldings: Record<string, number>
  userStats: UserStats | null
  loading: boolean
  error: string | null

  // Actions
  initializeUser: () => void
  connectWallet: () => Promise<boolean>
  disconnectWallet: () => void
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
  completeChallenge: (challenge: VibeChallenge) => Promise<void>
  loadZoraCoinMarket: () => Promise<void>
  purchaseZoraCoin: (coinId: string, amount: number) => Promise<boolean>
  sellZoraCoin: (coinId: string, amount: number) => Promise<boolean>
  loadUserStats: () => Promise<void>
  updateUserStats: (update: Partial<UserStats>) => void
  checkAndAwardAchievements: () => void
  setError: (error: string | null) => void
  clearError: () => void
}

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_vibe",
    name: "First Vibe",
    description: "Submit your first vibe",
    icon: "heart",
    earned: false,
  },
  {
    id: "swipe_master",
    name: "Swipe Master",
    description: "Swipe on 100 submissions",
    icon: "share2",
    earned: false,
    progress: 0,
    maxProgress: 100,
  },
  {
    id: "vibe_legend",
    name: "Vibe Legend",
    description: "Get 1000+ likes on a submission",
    icon: "trophy",
    earned: false,
  },
  {
    id: "trend_setter",
    name: "Trend Setter",
    description: "Create a viral vibe",
    icon: "trendingUp",
    earned: false,
  },
  {
    id: "voter",
    name: "Democratic Voter",
    description: "Cast 50 votes",
    icon: "vote",
    earned: false,
    progress: 0,
    maxProgress: 50,
  },
  {
    id: "trader",
    name: "Crypto Trader",
    description: "Complete 10 trades",
    icon: "coins",
    earned: false,
    progress: 0,
    maxProgress: 10,
  },
]

export const useVibeStore = create<VibeStore>()(
  persist(
    (set, get) => ({
      // Initial State
      user: null,
      vibePoints: 0,
      challenges: [],
      isWalletConnected: false,
      walletAddress: null,
      zoraCoinMarket: [],
      userHoldings: {},
      userStats: null,
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
          const username = `viber_${Math.random().toString(36).substr(2, 6)}`
          const newUser: User = {
            id: `user_${Date.now()}`,
            username,
            farcasterHandle: `@${username}`,
            createdAt: new Date(),
          }

          const newStats: UserStats = {
            totalSubmissions: 0,
            totalVotes: 0,
            totalSwipes: 0,
            totalShares: 0,
            winningSubmissions: 0,
            rank: Math.floor(Math.random() * 1000) + 1,
            joinDate: new Date(),
            achievements: [...DEFAULT_ACHIEVEMENTS],
          }

          set({
            user: newUser,
            userStats: newStats,
            vibePoints: 10, // Starting points
          })

          console.log("✅ User initialized:", newUser.username)
        }
      },

      connectWallet: async () => {
        try {
          set({ loading: true, error: null })
          console.log("🔗 Connecting wallet...")
          
          const connected = await blockchainService.connect()
          if (connected) {
            const address = await blockchainService.getAddress()
            
            set((state) => ({
              isWalletConnected: true,
              walletAddress: address,
              user: state.user ? { ...state.user, walletAddress: address || undefined } : null,
              loading: false,
            }))

            // Update vibe points from blockchain
            await get().updateVibePointsFromBlockchain()

            // Set up event listeners for wallet changes
            blockchainService.setupEventListeners(
              (accounts) => {
                if (accounts.length === 0) {
                  get().disconnectWallet()
                } else {
                  set({ walletAddress: accounts[0] })
                }
              },
              (chainId) => {
                console.log("Chain changed:", chainId)
                // Optionally refresh data when chain changes
              }
            )

            console.log("✅ Wallet connected:", address)
            return true
          } else {
            set({ loading: false, error: "Failed to connect wallet" })
            return false
          }
        } catch (error) {
          console.error("Failed to connect wallet:", error)
          set({ 
            loading: false, 
            error: error instanceof Error ? error.message : "Wallet connection failed" 
          })
          return false
        }
      },

      disconnectWallet: () => {
        blockchainService.removeEventListeners()
        set({
          isWalletConnected: false,
          walletAddress: null,
          user: get().user ? { ...get().user!, walletAddress: undefined } : null,
        })
        console.log("🔌 Wallet disconnected")
      },

      loadChallenges: async () => {
        try {
          set({ loading: true, error: null })
          console.log("📊 Loading challenges from AI trend analysis...")
          
          const aiChallenges = await aiTrendAnalyzer.generateDailyChallenges()
          const existingChallenges = get().challenges
          const mergedChallenges = [...existingChallenges]

          aiChallenges.forEach((newChallenge) => {
            const exists = existingChallenges.find((c) => c.title === newChallenge.title)
            if (!exists) {
              mergedChallenges.push(newChallenge)
            }
          })

          set({ challenges: mergedChallenges, loading: false })
          console.log(`✅ Loaded ${aiChallenges.length} new challenges, ${mergedChallenges.length} total`)

          await get().processCompletedChallenges()
        } catch (error) {
          console.error("Failed to load challenges:", error)
          const errorMessage = error instanceof Error ? error.message : "Failed to load challenges"
          set({ 
            loading: false, 
            error: `Challenge loading failed: ${errorMessage}` 
          })
        }
      },

      joinChallenge: async (challengeId: string) => {
        try {
          const challenge = get().challenges.find(c => c.id === challengeId)
          if (!challenge) {
            throw new Error("Challenge not found")
          }

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

          const challenge = get().challenges.find(c => c.id === challengeId)
          if (!challenge) {
            throw new Error("Challenge not found")
          }
          if (challenge.status !== "active") {
            throw new Error("Challenge is not accepting submissions")
          }

          let ipfsHash = ""
          let finalContent = submissionData.content

          // Upload to IPFS if it's a file
          if (submissionData.type === "image" && submissionData.content.startsWith("blob:")) {
            console.log("📤 Uploading content to IPFS...")
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

          // Submit to blockchain if connected and contracts deployed
          if (get().isWalletConnected && ipfsHash) {
            try {
              console.log("⛓️ Submitting to blockchain...")
              const challengeIdNum = parseInt(challengeId.split("_")[1]) || Date.now() % 1000
              await blockchainService.submitToChallenge(
                challengeIdNum,
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

          // Update user stats
          get().updateUserStats({
            totalSubmissions: (get().userStats?.totalSubmissions || 0) + 1
          })

          // Award points and check achievements
          get().addVibePoints(5)
          get().checkAndAwardAchievements()

          console.log("✅ Submission created:", newSubmission.title)
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

          // Update submission likes
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

          // Update user stats
          get().updateUserStats({
            totalSwipes: (get().userStats?.totalSwipes || 0) + 1
          })

          // Award VP for swipe
          get().addVibePoints(0.1)
          get().checkAndAwardAchievements()

          console.log("✅ Swipe processed:", submissionId, isLike ? "liked" : "passed")
        } catch (error) {
          console.error("Failed to swipe on submission:", error)
          throw error
        }
      },

      voteForSubmission: async (challengeId: string, submissionId: string) => {
        try {
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

          // Submit vote to blockchain if connected
          if (get().isWalletConnected) {
            try {
              const submissionIdNum = parseInt(submissionId.split("_")[1]) || Date.now() % 1000
              await blockchainService.voteForSubmission(submissionIdNum)
              console.log("✅ Blockchain vote successful")
            } catch (error) {
              console.error("Blockchain vote failed:", error)
              // Continue with local vote
            }
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

          // Update user stats
          get().updateUserStats({
            totalVotes: (get().userStats?.totalVotes || 0) + 1
          })

          // Check achievements
          get().checkAndAwardAchievements()

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

        console.log(`💎 Added ${points} VP, total: ${get().vibePoints}`)
      },

      updateVibePointsFromBlockchain: async () => {
        if (!get().isWalletConnected) return

        try {
          const userAddress = await blockchainService.getAddress()
          if (userAddress) {
            const blockchainPoints = await blockchainService.getUserVibePoints(userAddress)
            if (blockchainPoints > 0) {
              // Sync with blockchain points
              const currentPoints = get().vibePoints
              const syncedPoints = Math.max(currentPoints, blockchainPoints)
              
              set({ vibePoints: syncedPoints })
              console.log("✅ Synced vibe points with blockchain:", syncedPoints)
            }
          }
        } catch (error) {
          console.error("Failed to sync vibe points from blockchain:", error)
        }
      },

      processCompletedChallenges: async () => {
        const now = new Date()
        const challenges = get().challenges

        // Move active challenges to voting phase
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

        // Complete voting phase challenges
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
              console.log("🎨 Creating Zora Coin for winning submission...")
              const zoraResult = await createZoraCoinFromSubmission(winner, challenge)
              
              const zoraCoin: ZoraCoinMarket = {
                id: `zora_${zoraResult.address}`,
                address: zoraResult.address,
                name: winner.title,
                symbol: winner.title.toUpperCase().replace(/\s+/g, "").slice(0, 8),
                price: 1.0,
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

              set((state) => ({
                zoraCoinMarket: [...state.zoraCoinMarket, zoraCoin],
                challenges: state.challenges.map((c) =>
                  c.id === challenge.id ? { ...c, status: "completed" as const } : c,
                ),
              }))

              // Update winner's stats
              if (winner.author === get().user?.username) {
                get().updateUserStats({
                  winningSubmissions: (get().userStats?.winningSubmissions || 0) + 1
                })
                get().addVibePoints(50) // Bonus for winning
              }

              console.log("✅ Challenge completed, Zora Coin created:", zoraCoin.name)
            } catch (error) {
              console.error("Failed to create Zora Coin:", error)
              
              // Create fallback coin
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
                isActive: false,
              }

              set((state) => ({
                zoraCoinMarket: [...state.zoraCoinMarket, fallbackCoin],
                challenges: state.challenges.map((c) =>
                  c.id === challenge.id ? { ...c, status: "completed" as const } : c,
                ),
              }))
            }
          } else {
            set((state) => ({
              challenges: state.challenges.map((c) =>
                c.id === challenge.id ? { ...c, status: "completed" as const } : c,
              ),
            }))
            console.log("✅ Challenge completed with no clear winner:", challenge.title)
          }
        } catch (error) {
          console.error("Failed to complete challenge:", error)
          set((state) => ({
            challenges: state.challenges.map((c) =>
              c.id === challenge.id ? { ...c, status: "completed" as const } : c,
            ),
          }))
        }
      },

      loadZoraCoinMarket: async () => {
        try {
          console.log("📈 Loading Zora Coin market data...")
          
          // Load from Zora API if available
          try {
            const topGainers = await zoraCoinsService.getTopGainers(20)
            
            const realMarketCoins: ZoraCoinMarket[] = topGainers.map(coin => ({
              id: `real_${coin.address}`,
              address: coin.address,
              name: coin.name,
              symbol: coin.symbol,
              price: parseFloat(coin.price) || 1.0,
              change24h: Math.random() * 20 - 10,
              volume: parseFloat(coin.volume24h) || 0,
              marketCap: parseFloat(coin.marketCap) || 0,
              holders: coin.holders,
              contentType: "image" as const,
              contentPreview: coin.image || "/placeholder.svg?height=200&width=300",
              exclusiveContent: `Exclusive content for ${coin.name} holders`,
              createdAt: coin.createdAt,
              submissionId: `real_${coin.id}`,
              creator: coin.creator,
              isActive: coin.isActive,
            }))

            set((state) => {
              const existingChallengeCoins = state.zoraCoinMarket.filter(coin => 
                coin.id.startsWith('zora_') && !coin.id.startsWith('real_')
              )
              
              return {
                zoraCoinMarket: [...existingChallengeCoins, ...realMarketCoins]
              }
            })

            console.log(`✅ Loaded ${realMarketCoins.length} real Zora Coins`)
          } catch (error) {
            console.log("🔄 Using local market data")
            // Market already has local challenge coins
          }
        } catch (error) {
          console.error("Failed to load Zora market:", error)
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

          const totalCost = amount * coin.price
          const currentPoints = get().vibePoints

          // Check if user has enough vibe points (using VP as currency for demo)
          if (currentPoints < totalCost * 10) {
            throw new Error("Insufficient Vibe Points")
          }

          let realTradeSuccessful = false

          // Try real Zora trade if we have a real coin and wallet is connected
          if (coin.isActive && coin.address.startsWith('0x') && get().isWalletConnected) {
            try {
              console.log("💰 Executing REAL Zora Coin purchase...")
              const tradeResult = await zoraCoinsService.tradeCoin({
                coinAddress: coin.address,
                amountIn: (amount * coin.price * 1e18).toString(),
                tradeType: "buy",
                slippage: 0.05,
                tradeReferrer: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS
              })
              
              console.log("✅ REAL Zora trade successful! TX:", tradeResult.transactionHash)
              realTradeSuccessful = true

              // Show success message for real trade
              setTimeout(() => {
                const toast = (window as any).toast || console.log
                toast({
                  title: "Real blockchain trade executed! 🚀",
                  description: `Transaction: ${tradeResult.transactionHash.slice(0, 10)}...`,
                })
              }, 100)

            } catch (error) {
              console.error("❌ Real Zora trade failed:", error)
              // Don't throw - fall through to local tracking
              
              setTimeout(() => {
                const toast = (window as any).toast || console.log
                toast({
                  title: "Blockchain trade failed",
                  description: "Using local tracking instead. Check console for details.",
                  variant: "destructive"
                })
              }, 100)
            }
          }

          // Always update local state (for UI consistency)
          set((state) => ({
            userHoldings: {
              ...state.userHoldings,
              [coinId]: (state.userHoldings[coinId] || 0) + amount,
            },
            vibePoints: state.vibePoints - totalCost * 10,
          }))

          get().checkAndAwardAchievements()

          console.log(`✅ Purchase completed (${realTradeSuccessful ? 'REAL' : 'LOCAL'}):`, amount, coin.symbol)
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

          let realTradeSuccessful = false

          // Try real Zora trade if we have a real coin and wallet is connected
          if (coin.isActive && coin.address.startsWith('0x') && get().isWalletConnected) {
            try {
              console.log("💱 Executing REAL Zora Coin sale...")
              const tradeResult = await zoraCoinsService.tradeCoin({
                coinAddress: coin.address,
                amountIn: (amount * 1e18).toString(),
                tradeType: "sell",
                slippage: 0.05,
                tradeReferrer: process.env.NEXT_PUBLIC_PLATFORM_ADDRESS
              })
              
              console.log("✅ REAL Zora sale successful! TX:", tradeResult.transactionHash)
              realTradeSuccessful = true

              // Show success message for real trade
              setTimeout(() => {
                const toast = (window as any).toast || console.log
                toast({
                  title: "Real blockchain sale executed! 🚀",
                  description: `Transaction: ${tradeResult.transactionHash.slice(0, 10)}...`,
                })
              }, 100)

            } catch (error) {
              console.error("❌ Real Zora sale failed:", error)
              // Don't throw - fall through to local tracking
              
              setTimeout(() => {
                const toast = (window as any).toast || console.log
                toast({
                  title: "Blockchain sale failed",
                  description: "Using local tracking instead. Check console for details.",
                  variant: "destructive"
                })
              }, 100)
            }
          }

          const totalValue = amount * coin.price

          // Always update local state (for UI consistency)
          set((state) => ({
            userHoldings: {
              ...state.userHoldings,
              [coinId]: state.userHoldings[coinId] - amount,
            },
            vibePoints: state.vibePoints + totalValue * 10,
          }))

          get().checkAndAwardAchievements()

          console.log(`✅ Sale completed (${realTradeSuccessful ? 'REAL' : 'LOCAL'}):`, amount, coin.symbol)
          return true

        } catch (error) {
          console.error("Failed to sell Zora Coin:", error)
          const errorMessage = error instanceof Error ? error.message : "Sale failed"
          set({ error: `Sale failed: ${errorMessage}` })
          return false
        }
      },

      loadUserStats: async () => {
        try {
          // Initialize stats if not exists
          if (!get().userStats) {
            get().updateUserStats({
              totalSubmissions: 0,
              totalVotes: 0,
              totalSwipes: 0,
              totalShares: 0,
              winningSubmissions: 0,
              rank: Math.floor(Math.random() * 1000) + 1,
              joinDate: new Date(),
              achievements: [...DEFAULT_ACHIEVEMENTS],
            })
          }

          // Calculate stats from current data
          const { challenges, userStats } = get()
          const userSubmissions = challenges.flatMap(c => c.submissions || [])
            .filter(s => s.author === get().user?.username)

          const totalLikes = userSubmissions.reduce((sum, s) => sum + (s.likes || 0), 0)
          const totalVotes = userSubmissions.reduce((sum, s) => sum + (s.votes || 0), 0)

          get().updateUserStats({
            totalSubmissions: userSubmissions.length,
            // Keep existing vote/swipe counts as they're tracked separately
          })

          console.log("📊 User stats loaded")
        } catch (error) {
          console.error("Failed to load user stats:", error)
        }
      },

      updateUserStats: (update: Partial<UserStats>) => {
        set((state) => ({
          userStats: state.userStats ? { ...state.userStats, ...update } : {
            totalSubmissions: 0,
            totalVotes: 0,
            totalSwipes: 0,
            totalShares: 0,
            winningSubmissions: 0,
            rank: Math.floor(Math.random() * 1000) + 1,
            joinDate: new Date(),
            achievements: [...DEFAULT_ACHIEVEMENTS],
            ...update
          }
        }))
      },

      checkAndAwardAchievements: () => {
        const { userStats, vibePoints } = get()
        if (!userStats) return

        let updated = false
        const updatedAchievements = userStats.achievements.map(achievement => {
          if (achievement.earned) return achievement

          switch (achievement.id) {
            case "first_vibe":
              if (userStats.totalSubmissions >= 1) {
                updated = true
                return { ...achievement, earned: true, earnedAt: new Date() }
              }
              break

            case "swipe_master":
              const swipeProgress = Math.min(userStats.totalSwipes, achievement.maxProgress || 100)
              if (swipeProgress >= (achievement.maxProgress || 100)) {
                updated = true
                return { ...achievement, earned: true, earnedAt: new Date(), progress: swipeProgress }
              } else if (swipeProgress !== achievement.progress) {
                updated = true
                return { ...achievement, progress: swipeProgress }
              }
              break

            case "voter":
              const voteProgress = Math.min(userStats.totalVotes, achievement.maxProgress || 50)
              if (voteProgress >= (achievement.maxProgress || 50)) {
                updated = true
                return { ...achievement, earned: true, earnedAt: new Date(), progress: voteProgress }
              } else if (voteProgress !== achievement.progress) {
                updated = true
                return { ...achievement, progress: voteProgress }
              }
              break

            case "vibe_legend":
              // Check if any submission has 1000+ likes
              const challenges = get().challenges
              const userSubmissions = challenges.flatMap(c => c.submissions || [])
                .filter(s => s.author === get().user?.username)
              const hasViralSubmission = userSubmissions.some(s => (s.likes || 0) >= 1000)
              
              if (hasViralSubmission) {
                updated = true
                return { ...achievement, earned: true, earnedAt: new Date() }
              }
              break

            case "trend_setter":
              if (userStats.winningSubmissions >= 1) {
                updated = true
                return { ...achievement, earned: true, earnedAt: new Date() }
              }
              break
          }

          return achievement
        })

        if (updated) {
          get().updateUserStats({ achievements: updatedAchievements })
          
          // Award bonus points for new achievements
          const newAchievements = updatedAchievements.filter(a => 
            a.earned && 
            !userStats.achievements.find(old => old.id === a.id && old.earned)
          )
          
          if (newAchievements.length > 0) {
            get().addVibePoints(newAchievements.length * 10) // 10 VP per achievement
            console.log("🏆 New achievements unlocked:", newAchievements.map(a => a.name))
          }
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
        userStats: state.userStats,
      }),
    },
  ),
)