"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, BarChart3, Target, Bell, ArrowRight } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

export function OnboardingComplete() {
  const router = useRouter()
  const { data } = useOnboarding()

  const handleGoToDashboard = () => {
    router.push("/insights")
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-3">Setup Complete!</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          You've successfully set up your Dalgo workspace. Here's what you've created:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Chart Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 rounded-full p-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg">Chart Created</h3>
            </div>
            <h4 className="font-semibold mb-1">{data.chart?.title || "Maternal Health Outcomes"}</h4>
            <p className="text-sm text-gray-500">
              {data.chart?.type || "Bar"} chart showing {data.chart?.xAxis || "Location"} vs{" "}
              {data.chart?.yAxis || "Outcomes"}
            </p>
          </CardContent>
        </Card>

        {/* Metric Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 rounded-full p-2">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-bold text-lg">Metric Defined</h3>
            </div>
            <h4 className="font-semibold mb-1">{data.metric?.name || "Placement Rate"}</h4>
            <p className="text-sm text-gray-500">
              {data.metric?.aggregation || "Percentage"} of {data.metric?.column || "Placement Status"}
            </p>
          </CardContent>
        </Card>

        {/* Alert Summary */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-orange-100 rounded-full p-2">
                <Bell className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-bold text-lg">Alert Configured</h3>
            </div>
            <h4 className="font-semibold mb-1">{data.alert?.name || "Low Placement Alert"}</h4>
            <p className="text-sm text-gray-500">
              {data.alert?.severity || "Medium"} priority alert for {data.alert?.metric || "Placement Rate"}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button onClick={handleGoToDashboard} size="lg" className="px-8">
          Go to Impact Dashboard <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <p className="text-sm text-gray-500 mt-4">
          You can always add more data sources, charts, and alerts from the main dashboard.
        </p>
      </div>
    </div>
  )
}
