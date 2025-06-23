"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface WelcomeStepProps {
  onNext: () => void
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header and Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-4xl font-bold mb-6">Welcome to Dalgo Vision</h1>
          <p className="text-xl text-gray-600 mb-8">
            Let's set up your first dashboard to monitor your key metrics and outcomes
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                1
              </div>
              <h3 className="text-lg font-medium mb-2">Connect Data</h3>
              <p className="text-gray-600">Import your data from CSV files or connect to external sources</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                2
              </div>
              <h3 className="text-lg font-medium mb-2">Transform & Visualize</h3>
              <p className="text-gray-600">Clean your data and create insightful visualizations</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-12 w-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                3
              </div>
              <h3 className="text-lg font-medium mb-2">Monitor & Share</h3>
              <p className="text-gray-600">Set up metrics, alerts and share insights with your team</p>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <p className="text-gray-600 mb-8">
              This guided setup will help you create your first dashboard in just a few minutes. You'll be able to track
              your key performance indicators, set up alerts for critical metrics, and share insights with your team.
            </p>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0 border-t bg-white px-6 py-4">
        <div className="flex justify-center max-w-6xl mx-auto">
          <Button onClick={onNext} size="lg" className="px-8">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
