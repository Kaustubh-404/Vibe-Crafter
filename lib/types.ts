export interface User {
  id: string
  username: string
  farcasterHandle: string
  createdAt: Date
}

export interface Submission {
  id: string
  challengeId: string
  type: "image" | "text" | "link"
  content: string
  title: string
  author: string
  authorId: string
  createdAt: Date
  likes?: number
  shares?: number
  votes?: number
}

export interface Challenge {
  id: string
  title: string
  description: string
  category: string
  status: "active" | "voting" | "completed"
  createdAt: Date
  endTime: Date
  trendingTopics?: string[]
  submissions?: Submission[]
  totalLikes?: number
}

export interface ZoraCoin {
  id: string
  name: string
  symbol: string
  submissionId: string
  price: number
  marketCap: number
  holders: number
  createdAt: Date
}
