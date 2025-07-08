"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { blockchainService } from "@/lib/blockchain"

interface WalletContextType {
  isConnected: boolean
  address: string | null
  connect: () => Promise<boolean>
  disconnect: () => void
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false)
  const [address, setAddress] = useState<string | null>(null)

  useEffect(() => {
    // Check if already connected
    checkConnection()
  }, [])

  const checkConnection = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" })
        if (accounts.length > 0) {
          setIsConnected(true)
          setAddress(accounts[0])
          await blockchainService.connect()
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error)
      }
    }
  }

  const connect = async (): Promise<boolean> => {
    try {
      const connected = await blockchainService.connect()
      if (connected) {
        const userAddress = await blockchainService.getAddress()
        setIsConnected(true)
        setAddress(userAddress)
        return true
      }
      return false
    } catch (error) {
      console.error("Error connecting wallet:", error)
      return false
    }
  }

  const disconnect = () => {
    setIsConnected(false)
    setAddress(null)
  }

  return (
    <WalletContext.Provider value={{ isConnected, address, connect, disconnect }}>{children}</WalletContext.Provider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}
