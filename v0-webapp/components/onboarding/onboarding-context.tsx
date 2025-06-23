"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Dataset {
  name: string
  columns: Array<{ name: string; type: string }>
  data: any[]
}

interface OnboardingData {
  dataSource: {
    type: "csv" | "sample" | "external" | null
    file?: File
    sampleDataset?: string
    externalSource?: string
  }
  workspace: {
    type: "temporary" | "warehouse" | null
    config?: any
  }
  transformations: any[]
  datasets: Record<string, Dataset>
  chart?: any
  metric?: any
  alert?: any
}

interface OnboardingContextType {
  data: OnboardingData
  updateData: (updates: Partial<OnboardingData>) => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>({
    dataSource: { type: null },
    workspace: { type: null },
    transformations: [],
    datasets: {},
  })

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  return <OnboardingContext.Provider value={{ data, updateData }}>{children}</OnboardingContext.Provider>
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider")
  }
  return context
}
