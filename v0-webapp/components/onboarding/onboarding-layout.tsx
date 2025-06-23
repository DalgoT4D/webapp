"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Play, Database, Cloud, ArrowUpDown, BarChart, Target, Bell, CheckCircle2 } from "lucide-react"

interface Step {
  id: number
  name: string
  icon: string
}

interface OnboardingLayoutProps {
  children: ReactNode
  currentStep: number
  steps: Step[]
}

export function OnboardingLayout({ children, currentStep, steps }: OnboardingLayoutProps) {
  const [isExpanded, setIsExpanded] = useState(currentStep === 1) // Always expanded on first step
  const isFirstStep = currentStep === 1

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Play":
        return <Play className="h-4 w-4" />
      case "Database":
        return <Database className="h-4 w-4" />
      case "Cloud":
        return <Cloud className="h-4 w-4" />
      case "ArrowUpDown":
        return <ArrowUpDown className="h-4 w-4" />
      case "BarChart":
        return <BarChart className="h-4 w-4" />
      case "Target":
        return <Target className="h-4 w-4" />
      case "Bell":
        return <Bell className="h-4 w-4" />
      default:
        return <CheckCircle2 className="h-4 w-4" />
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Dynamic Header */}
      <div
        className={`bg-white border-b border-gray-200 transition-all duration-300 ease-in-out ${
          isExpanded || isFirstStep ? "h-36" : "h-12"
        } flex-shrink-0 overflow-hidden`}
        onMouseEnter={() => !isFirstStep && setIsExpanded(true)}
        onMouseLeave={() => !isFirstStep && setIsExpanded(false)}
      >
        <div className="h-full px-6 flex items-center justify-between">
          {/* Minimized State - Only for non-first steps */}
          {!isExpanded && !isFirstStep && (
            <>
              <div className="flex items-center gap-3">
                <h1 className="text-lg font-bold text-gray-900">Dalgo</h1>
                <div className="flex items-center gap-2">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-6 h-6 rounded-full border transition-all ${
                          step.id === currentStep
                            ? "bg-blue-600 border-blue-600 text-white"
                            : step.id < currentStep
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-white border-gray-300 text-gray-400"
                        }`}
                      >
                        {step.id < currentStep ? <CheckCircle2 className="h-3 w-3" /> : getIcon(step.icon)}
                      </div>
                      {index < steps.length - 1 && (
                        <div
                          className={`w-4 h-0.5 mx-1 transition-all ${
                            step.id < currentStep ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Step {currentStep} of {steps.length}
              </div>
            </>
          )}

          {/* Expanded State */}
          {(isExpanded || isFirstStep) && (
            <div className="w-full py-4">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Setup Dalgo</h1>
                  <p className="text-gray-600 mt-1">Get your automated insights platform ready</p>
                </div>
                <div className="text-sm text-gray-500">
                  Step {currentStep} of {steps.length}
                </div>
              </div>

              {/* Progress bar with proper spacing */}
              <div className="relative pb-8">
                <div className="flex items-center justify-between max-w-4xl mx-auto">
                  {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center flex-1">
                      <div className="relative flex flex-col items-center flex-1">
                        {/* Step circle */}
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all z-10 ${
                            step.id === currentStep
                              ? "bg-blue-600 border-blue-600 text-white shadow-lg"
                              : step.id < currentStep
                                ? "bg-blue-600 border-blue-600 text-white"
                                : "bg-white border-gray-300 text-gray-400"
                          }`}
                        >
                          {step.id < currentStep ? <CheckCircle2 className="h-4 w-4" /> : getIcon(step.icon)}
                        </div>

                        {/* Step label */}
                        <div className="mt-3 text-center">
                          <p
                            className={`text-xs font-medium whitespace-nowrap ${
                              step.id <= currentStep ? "text-blue-600" : "text-gray-400"
                            }`}
                          >
                            {step.name}
                          </p>
                        </div>
                      </div>

                      {/* Connector line */}
                      {index < steps.length - 1 && (
                        <div
                          className={`h-0.5 flex-1 mx-4 transition-all ${
                            step.id < currentStep ? "bg-blue-600" : "bg-gray-200"
                          }`}
                          style={{ marginTop: "-16px" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content - Takes remaining space */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
