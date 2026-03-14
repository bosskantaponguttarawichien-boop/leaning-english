"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { initLiff, getLiffProfile, isLiffLoggedIn, liffLogin, LiffProfile } from "@/lib/liff"

type LiffContextType = {
  profile: LiffProfile | null
  isLoggedIn: boolean
  isLoading: boolean
  login: () => void
}

const LiffContext = createContext<LiffContextType>({
  profile: null,
  isLoggedIn: false,
  isLoading: true,
  login: () => {},
})

export function useLiff() {
  return useContext(LiffContext)
}

export default function LiffProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<LiffProfile | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function init() {
      try {
        await initLiff()

        if (!isLiffLoggedIn()) {
          liffLogin()
          return
        }

        setIsLoggedIn(true)
        const userProfile = await getLiffProfile()
        setProfile(userProfile)
      } catch (error) {
        console.error("LIFF initialization failed:", error)
      } finally {
        setIsLoading(false)
      }
    }

    init()
  }, [])

  return (
    <LiffContext.Provider value={{ profile, isLoggedIn, isLoading, login: liffLogin }}>
      {children}
    </LiffContext.Provider>
  )
}
