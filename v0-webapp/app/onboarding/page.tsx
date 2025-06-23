"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { OnboardingProvider } from "@/components/onboarding/onboarding-context"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import { WelcomeStep } from "@/components/onboarding/welcome-step"
import { DataSourceStep } from "@/components/onboarding/data-source-step"
import { WorkspaceStep } from "@/components/onboarding/workspace-step"
import { TransformStep } from "@/components/onboarding/transform-step"
import { ChartCreationStep } from "@/components/onboarding/chart-creation-step"
import { MetricCreationStep } from "@/components/onboarding/metric-creation-step"
import { AlertCreationStep } from "@/components/onboarding/alert-creation-step"

export default function OnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  const steps = [
    { id: 1, name: "Start", icon: "Play" },
    { id: 2, name: "Data Sources", icon: "Database" },
    { id: 3, name: "Data Storage", icon: "Cloud" },
    { id: 4, name: "Transform", icon: "ArrowUpDown" },
    { id: 5, name: "Visualize", icon: "BarChart" },
    { id: 6, name: "Metrics", icon: "Target" },
    { id: 7, name: "Alerts", icon: "Bell" },
  ]

  const goToNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    } else {
      // Onboarding complete, redirect to dashboard
      router.push("/insights")
    }
  }

  const goToPrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep onNext={goToNext} />
      case 2:
        return <DataSourceStep onNext={goToNext} onBack={goToPrevious} />
      case 3:
        return <WorkspaceStep onNext={goToNext} onBack={goToPrevious} />
      case 4:
        return <TransformStep onNext={goToNext} onBack={goToPrevious} />
      case 5:
        return <ChartCreationStep onNext={goToNext} onBack={goToPrevious} />
      case 6:
        return <MetricCreationStep onNext={goToNext} onBack={goToPrevious} />
      case 7:
        return <AlertCreationStep onNext={goToNext} onBack={goToPrevious} />
      default:
        return <WelcomeStep onNext={goToNext} />
    }
  }

  return (
    <OnboardingProvider>
      <OnboardingLayout currentStep={currentStep} steps={steps}>
        {renderStep()}
      </OnboardingLayout>
    </OnboardingProvider>
  )
}
