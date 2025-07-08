"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, Coins, Lock, Unlock, DollarSign } from "lucide-react"
import { useVibeStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function TradingScreen() {
  const [selectedCoin, setSelectedCoin] = useState<any>(null)
  const [tradeAmount, setTradeAmount] = useState("")
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy")
  const [loading, setLoading] = useState(false)

  const { zoraCoinMarket, userHoldings, loadZoraCoinMarket, purchaseZoraCoin, sellZoraCoin } = useVibeStore()

  useEffect(() => {
    loadZoraCoinMarket()
  }, [loadZoraCoinMarket])

  const handleTrade = async () => {
    if (!selectedCoin || !tradeAmount) return

    const amount = Number.parseFloat(tradeAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      let success = false

      if (tradeType === "buy") {
        success = await purchaseZoraCoin(selectedCoin.id, amount)
        if (success) {
          toast({
            title: "Purchase successful! 🎉",
            description: `Bought ${amount} ${selectedCoin.symbol} for ${(amount * selectedCoin.price).toFixed(3)} ZORA`,
          })
        }
      } else {
        success = await sellZoraCoin(selectedCoin.id, amount)
        if (success) {
          toast({
            title: "Sale successful! 💰",
            description: `Sold ${amount} ${selectedCoin.symbol} for ${(amount * selectedCoin.price).toFixed(3)} ZORA`,
          })
        }
      }

      if (!success) {
        toast({
          title: "Trade failed",
          description: "Please check your balance and try again.",
          variant: "destructive",
        })
      } else {
        setTradeAmount("")
        setSelectedCoin(null)
      }
    } catch (error) {
      toast({
        title: "Trade failed",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const canAccessContent = (coin: any) => {
    return (userHoldings[coin.id] || 0) >= 0.1
  }

  const getPortfolioValue = () => {
    return Object.entries(userHoldings).reduce((total, [coinId, amount]) => {
      const coin = zoraCoinMarket.find((c) => c.id === coinId)
      return total + (coin ? amount * coin.price : 0)
    }, 0)
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Zora Coin Trading</h2>
        <p className="text-gray-600">Trade tokenized vibes and unlock exclusive content</p>
        <div className="mt-2">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            Portfolio Value: {getPortfolioValue().toFixed(3)} ZORA
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="market" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="space-y-4">
          {zoraCoinMarket.length > 0 ? (
            <div className="grid gap-4">
              {zoraCoinMarket.map((coin) => (
                <Card key={coin.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center">
                            <Coins className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{coin.name}</h3>
                            <p className="text-sm text-gray-600">{coin.symbol}</p>
                          </div>
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            New
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-500">Price</p>
                            <p className="font-semibold">{coin.price.toFixed(3)} ZORA</p>
                          </div>
                          <div>
                            <p className="text-gray-500">24h Change</p>
                            <p
                              className={`font-semibold flex items-center ${
                                coin.change24h >= 0 ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {coin.change24h >= 0 ? (
                                <TrendingUp className="w-4 h-4 mr-1" />
                              ) : (
                                <TrendingDown className="w-4 h-4 mr-1" />
                              )}
                              {coin.change24h.toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Market Cap</p>
                            <p className="font-semibold">{coin.marketCap} ZORA</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Holders</p>
                            <p className="font-semibold">{coin.holders}</p>
                          </div>
                        </div>

                        {/* Content Preview */}
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Original Content:</p>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            {coin.contentType === "image" && (
                              <img
                                src={coin.contentPreview || "/placeholder.svg"}
                                alt={coin.name}
                                className="w-full h-32 object-cover rounded"
                              />
                            )}
                            {coin.contentType === "text" && (
                              <p className="text-sm text-gray-700 line-clamp-3">{coin.contentPreview}</p>
                            )}
                            {coin.contentType === "link" && (
                              <a
                                href={coin.contentPreview}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 break-all"
                              >
                                {coin.contentPreview}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => setSelectedCoin(coin)}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      >
                        Trade
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Zora Coins Available</h3>
                <p className="text-gray-600">
                  Zora Coins are created when challenges are completed. Submit content and vote to create new tokens!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              {Object.keys(userHoldings).length > 0 ? (
                <div className="space-y-4">
                  {Object.entries(userHoldings).map(([coinId, amount]) => {
                    const coin = zoraCoinMarket.find((c) => c.id === coinId)
                    if (!coin || amount <= 0) return null

                    const value = amount * coin.price
                    return (
                      <div key={coinId} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-lg flex items-center justify-center">
                            <Coins className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{coin.symbol}</h4>
                            <p className="text-sm text-gray-600">{coin.name}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{amount.toFixed(3)} tokens</p>
                          <p className="text-sm text-gray-600">{value.toFixed(3)} ZORA</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCoin(coin)
                              setTradeType("sell")
                            }}
                            className="mt-1"
                          >
                            Sell
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total Portfolio Value:</span>
                      <span className="font-bold text-lg">{getPortfolioValue().toFixed(3)} ZORA</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Coins className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No holdings yet. Start trading to build your portfolio!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <div className="grid gap-4">
            {zoraCoinMarket.map((coin) => (
              <Card key={coin.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{coin.name}</h3>
                      <p className="text-sm text-gray-600">{coin.exclusiveContent}</p>
                    </div>
                    <Badge variant={canAccessContent(coin) ? "default" : "secondary"}>
                      {canAccessContent(coin) ? (
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

                  {canAccessContent(coin) ? (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-green-800 mb-3">🎉 You have access to this exclusive content!</p>
                      <Button variant="outline" className="text-green-700 border-green-300 bg-transparent">
                        View Exclusive Content
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-600 mb-3">Hold at least 0.1 {coin.symbol} to unlock exclusive content.</p>
                      <p className="text-sm text-gray-500 mb-3">
                        You need {(0.1 - (userHoldings[coin.id] || 0)).toFixed(3)} more tokens.
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedCoin(coin)
                          setTradeType("buy")
                          setTradeAmount("0.1")
                        }}
                        size="sm"
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
                      >
                        <DollarSign className="w-4 h-4 mr-1" />
                        Buy Access (0.1 tokens)
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Trading Modal */}
      {selectedCoin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Trade {selectedCoin.symbol}</span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCoin(null)}>
                  ×
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button
                  variant={tradeType === "buy" ? "default" : "outline"}
                  onClick={() => setTradeType("buy")}
                  className="flex-1"
                >
                  Buy
                </Button>
                <Button
                  variant={tradeType === "sell" ? "default" : "outline"}
                  onClick={() => setTradeType("sell")}
                  className="flex-1"
                >
                  Sell
                </Button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ({selectedCoin.symbol})</label>
                <Input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0.0"
                  step="0.001"
                />
              </div>

              {tradeAmount && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Total: {(Number.parseFloat(tradeAmount) * selectedCoin.price).toFixed(3)} ZORA
                  </p>
                </div>
              )}

              {tradeType === "sell" && (
                <div className="text-sm text-gray-600">
                  Available: {(userHoldings[selectedCoin.id] || 0).toFixed(3)} {selectedCoin.symbol}
                </div>
              )}

              <Button
                onClick={handleTrade}
                disabled={!tradeAmount || loading}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700"
              >
                {loading ? "Processing..." : `${tradeType === "buy" ? "Buy" : "Sell"} ${selectedCoin.symbol}`}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
