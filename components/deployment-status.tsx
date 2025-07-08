"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertCircle, ExternalLink, Copy, Zap } from "lucide-react"
import { BLOCKCHAIN_CONFIG, validateConfig } from "@/lib/config"
import { blockchainService } from "@/lib/blockchain"
import { toast } from "@/hooks/use-toast"

export default function DeploymentStatus() {
  const [contractsDeployed, setContractsDeployed] = useState(false)
  const [networkConnected, setNetworkConnected] = useState(false)
  const [configValid, setConfigValid] = useState(false)
  const [currentNetwork, setCurrentNetwork] = useState<any>(null)

  useEffect(() => {
    checkDeploymentStatus()
  }, [])

  const checkDeploymentStatus = async () => {
    // Check configuration
    const isConfigValid = validateConfig()
    setConfigValid(isConfigValid)

    // Check if contracts are deployed
    const contractsExist =
      BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS !== "" && BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS !== ""
    setContractsDeployed(contractsExist)

    // Check network connection
    try {
      const connected = await blockchainService.connect()
      setNetworkConnected(connected)

      if (connected) {
        const network = await blockchainService.getCurrentNetwork()
        setCurrentNetwork(network)
      }
    } catch (error) {
      setNetworkConnected(false)
    }
  }

  const switchToZora = async () => {
    try {
      const success = await blockchainService.switchToZoraNetwork(true) // true for testnet
      if (success) {
        toast({
          title: "Switched to Zora Network! 🎨",
          description: "Perfect for creator tools and Zora Protocol integration",
        })
        checkDeploymentStatus()
      }
    } catch (error) {
      toast({
        title: "Failed to switch network",
        description: "Please try manually adding Zora Network to your wallet",
        variant: "destructive",
      })
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    })
  }

  const openBlockExplorer = (address: string) => {
    window.open(`${BLOCKCHAIN_CONFIG.BLOCK_EXPLORER}/address/${address}`, "_blank")
  }

  return (
    <Card className="mb-6 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <span>🎨 Zora Network Deployment Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Network Recommendation */}
        <div className="bg-gradient-to-r from-purple-100 to-indigo-100 p-4 rounded-lg">
          <h4 className="font-medium text-purple-900 mb-2">🎯 Recommended: Deploy on Zora Network</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-purple-800">
            <div>
              <p>✅ Native Zora Protocol integration</p>
              <p>✅ Zora Coins SDK support</p>
              <p>✅ Creator-focused ecosystem</p>
            </div>
            <div>
              <p>✅ Lower fees than Ethereum</p>
              <p>✅ Built for NFT creators</p>
              <p>✅ Direct minting infrastructure</p>
            </div>
          </div>
        </div>

        {/* Current Network Status */}
        {currentNetwork && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {currentNetwork.isZora ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              <span>Current Network</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={currentNetwork.isZora ? "default" : "secondary"}>
                {currentNetwork.name} (Chain {currentNetwork.chainId})
              </Badge>
              {!currentNetwork.isZora && (
                <Button onClick={switchToZora} size="sm" variant="outline">
                  Switch to Zora
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Configuration Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {configValid ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>Configuration</span>
          </div>
          <Badge variant={configValid ? "default" : "destructive"}>{configValid ? "Valid" : "Missing"}</Badge>
        </div>

        {/* Contracts Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {contractsDeployed ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
            <span>Smart Contracts</span>
          </div>
          <Badge variant={contractsDeployed ? "default" : "secondary"}>
            {contractsDeployed ? "Deployed" : "Not Deployed"}
          </Badge>
        </div>

        {/* Network Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {networkConnected ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span>Wallet Connection</span>
          </div>
          <Badge variant={networkConnected ? "default" : "destructive"}>
            {networkConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        {/* Contract Addresses */}
        {contractsDeployed && (
          <div className="space-y-3 pt-4 border-t">
            <h4 className="font-medium">Contract Addresses:</h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white p-3 rounded">
                <div>
                  <p className="font-medium text-sm">VibeToken</p>
                  <p className="text-xs text-gray-600 font-mono">{BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS}</p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS, "VibeToken address")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openBlockExplorer(BLOCKCHAIN_CONFIG.VIBE_TOKEN_ADDRESS)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between bg-white p-3 rounded">
                <div>
                  <p className="font-medium text-sm">ChallengeManager</p>
                  <p className="text-xs text-gray-600 font-mono">{BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS}</p>
                </div>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS, "ChallengeManager address")
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openBlockExplorer(BLOCKCHAIN_CONFIG.CHALLENGE_MANAGER_ADDRESS)}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deployment Instructions */}
        {!contractsDeployed && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-800 mb-2">🚀 Zora Network Deployment Steps:</h4>
            <ol className="text-sm text-purple-700 space-y-1 list-decimal list-inside">
              <li>
                Get testnet ETH from{" "}
                <a href="https://sepoliafaucet.com" target="_blank" className="underline" rel="noreferrer">
                  Sepolia Faucet
                </a>
              </li>
              <li>
                Bridge to Zora Sepolia via{" "}
                <a href="https://bridge.zora.energy" target="_blank" className="underline" rel="noreferrer">
                  Zora Bridge
                </a>
              </li>
              <li>
                Deploy contracts via{" "}
                <a href="https://remix.ethereum.org" target="_blank" className="underline" rel="noreferrer">
                  Remix IDE
                </a>
              </li>
              <li>
                Update contract addresses in <code>lib/blockchain.ts</code>
              </li>
              <li>
                Add addresses to <code>.env.local</code>
              </li>
              <li>Restart the development server</li>
            </ol>
          </div>
        )}

        <Button onClick={checkDeploymentStatus} variant="outline" className="w-full bg-transparent">
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}
