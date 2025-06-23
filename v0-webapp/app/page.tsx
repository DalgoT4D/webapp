"use client"

import { redirect } from "next/navigation"
import { useEffect, useState } from "react"
import { OnboardingDashboard } from "@/components/dashboard/onboarding-dashboard"
import { ImpactDashboard } from "@/components/dashboard/impact-dashboard"

export default function Home() {
  // Redirect to onboarding by default
  redirect("/onboarding")

  const [showOnboardingDashboard, setShowOnboardingDashboard] = useState(false)

  useEffect(() => {
    // Check if user just completed onboarding
    const isOnboardingComplete = localStorage.getItem("isOnboardingComplete")
    const hasOnboardingChart = localStorage.getItem("onboardingChart")

    if (isOnboardingComplete && hasOnboardingChart) {
      setShowOnboardingDashboard(true)
    }
  }, [])

  // Show onboarding dashboard if user just completed setup
  if (showOnboardingDashboard) {
    return <OnboardingDashboard />
  }

  // Show regular impact dashboard
  return <ImpactDashboard />
}
