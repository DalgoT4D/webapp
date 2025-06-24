"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Bot, CornerDownLeft, Loader2 } from "lucide-react"
import type { DashboardType } from "./dashboard-view"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DashboardChatProps {
  dashboardType: DashboardType
  selectedElement: string | null
  onClose: () => void
}

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function DashboardChat({
  dashboardType = "implementation",
  selectedElement = null,
  onClose,
}: DashboardChatProps) {
  // Ensure we have a valid dashboard type
  const currentDashboard = dashboardType || "implementation"
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize chat with welcome message when component mounts or selectedElement changes
  useEffect(() => {
    if (!isInitialized || selectedElement !== null) {
      const welcomeMessage = {
        id: `welcome-${Date.now()}`,
        role: "assistant" as const,
        content: selectedElement
          ? `I see you're interested in the ${getElementTitle(selectedElement)} chart. What would you like to know about it?`
          : `Welcome to the ${getDashboardTitle(currentDashboard)} dashboard assistant! How can I help you today?`,
        timestamp: new Date(),
      }

      setMessages((prev) => {
        // If selectedElement changed, add a new message
        if (selectedElement !== null) {
          return [...prev, welcomeMessage]
        }
        // If it's initial load, start with welcome message
        if (!isInitialized) {
          return [welcomeMessage]
        }
        return prev
      })

      setIsInitialized(true)

      // Focus the input after a short delay
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [currentDashboard, selectedElement, isInitialized])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]")
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight
      }
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!inputValue.trim()) return

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response with typing effect
    setTimeout(() => {
      const responseContent = generateResponse(inputValue, currentDashboard, selectedElement)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1500)
  }

  // Ensure we have a valid onClose function
  const handleClose = () => {
    if (onClose && typeof onClose === "function") {
      onClose()
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Dashboard Assistant</h3>
          {selectedElement && (
            <Badge variant="outline" className="ml-2 bg-primary/10">
              {getElementTitle(selectedElement)}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Chat Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`flex gap-2 max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>AI</AvatarFallback>
                    <AvatarImage src="/ai-assistant-avatar.png" alt="AI Assistant" />
                  </Avatar>
                )}
                <div
                  className={cn(
                    "rounded-lg p-3 text-sm",
                    message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>U</AvatarFallback>
                    <AvatarImage src="/user-avatar.png" alt="User" />
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-2 max-w-[80%]">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>AI</AvatarFallback>
                  <AvatarImage src="/ai-assistant-avatar.png" alt="AI Assistant" />
                </Avatar>
                <div className="rounded-lg p-3 text-sm bg-muted">
                  <div className="flex gap-1">
                    <div className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce"></div>
                    <div
                      className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                    <div
                      className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce"
                      style={{ animationDelay: "0.4s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Chat Input */}
      <div className="p-3 border-t">
        <form
          className="flex gap-2 relative"
          onSubmit={(e) => {
            e.preventDefault()
            handleSendMessage()
          }}
        >
          <Input
            ref={inputRef}
            placeholder={`Ask about ${selectedElement ? getElementTitle(selectedElement) : getDashboardTitle(currentDashboard)}...`}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="pr-10"
          />
          <div className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground">
            {!isLoading && inputValue.trim() && <CornerDownLeft className="h-4 w-4 opacity-70" />}
          </div>
          <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  )
}

// Helper functions
function getDashboardTitle(type: DashboardType): string {
  const titles: Record<DashboardType, string> = {
    implementation: "Implementation",
    impact: "Impact",
    funder: "Funder",
    usage: "Usage",
  }
  return titles[type] || "Dashboard"
}

function getElementTitle(elementId: string): string {
  if (!elementId) return "Dashboard Element"

  const titles: Record<string, string> = {
    "visit-completion": "Visit Completion",
    "protocol-adherence": "Protocol Adherence",
    "risk-distribution": "Risk Distribution",
    "supply-levels": "Supply Levels",
    "team-performance": "Team Performance",
    "field-visits": "Field Visits",
    "health-outcomes": "Health Outcomes",
    "beneficiary-reach": "Beneficiary Reach",
    "regional-impact": "Regional Impact",
    "regional-map": "Regional Performance Map",
    "trend-analysis": "Trend Analysis",
    "impact-metrics": "Impact Metrics",
    "budget-utilization": "Budget Utilization",
    "cost-per-beneficiary": "Cost Per Beneficiary",
    "outcomes-by-investment": "Outcomes By Investment",
    "program-sustainability": "Program Sustainability",
    "funding-allocation": "Funding Allocation",
    "user-activity": "User Activity",
    "feature-usage": "Feature Usage",
    "data-quality": "Data Quality",
    "system-performance": "System Performance",
    "user-feedback": "User Feedback",
    "key-insights": "Key Insights",
    mothers: "Total Mothers",
    visits: "Visit Completion Rate",
    protocols: "Protocol Adherence",
    risk: "High Risk Cases",
  }

  return titles[elementId] || "Dashboard Element"
}

function generateResponse(query: string, dashboardType: DashboardType, selectedElement: string | null): string {
  // Normalize the query for easier matching
  const normalizedQuery = query.toLowerCase().trim()

  // Check for common greeting patterns
  if (/^(hi|hello|hey|greetings)/.test(normalizedQuery)) {
    return `Hello! I'm your dashboard assistant. I can help you understand the data and insights in the ${getDashboardTitle(dashboardType)} dashboard. What would you like to know?`
  }

  // If a specific chart is selected, provide more targeted responses
  if (selectedElement) {
    const elementTitle = getElementTitle(selectedElement)

    // Chart-specific responses based on the query
    if (normalizedQuery.includes("explain") || normalizedQuery.includes("what") || normalizedQuery.includes("show")) {
      if (selectedElement === "visit-completion") {
        return `The Visit Completion chart shows the percentage of scheduled visits that were successfully completed by each field team. Team D has the highest completion rate at 95%, while Team C is underperforming at 76%, which is below our target of 85%. This suggests Team C may need additional support or training.`
      }

      if (selectedElement === "protocol-adherence") {
        return `The Protocol Adherence chart shows that 76% of all protocols were followed correctly during visits, while 24% were missed. This is concerning as we've seen a 3% decline in adherence over the past month. The most commonly missed protocols are nutritional assessments, which are down 7.5%.`
      }

      if (selectedElement === "risk-distribution") {
        return `The Risk Distribution chart breaks down mothers in our program by risk category. We currently have 142 high-risk cases (which is up 8% from last month), 387 medium-risk cases, 1,024 low-risk cases, and 1,300 healthy mothers. Our goal is to reduce high-risk cases through targeted interventions.`
      }

      if (selectedElement === "supply-levels") {
        return `The Supply Levels chart shows current inventory levels as a percentage of required stock. Prenatal vitamins are critically low at 15% (below our 20% threshold), putting us at risk of stockout in 8 days. Other supplies like Iron Supplements (42%) and Folic Acid (38%) are at acceptable levels, while Malaria Prevention supplies are well-stocked at 65%.`
      }

      if (selectedElement === "team-performance") {
        return `The Team Performance radar chart compares teams across 5 key metrics: Visit Completion, Protocol Adherence, Data Quality, Beneficiary Satisfaction, and Response Time. Team D consistently outperforms other teams across all metrics, while Team C is underperforming, particularly in Visit Completion (76%) and Response Time (75%).`
      }

      if (selectedElement === "regional-impact") {
        return `The Regional Impact Map shows performance metrics across different states in India. States in red (like Maharashtra, Bihar, and Uttar Pradesh) have high-risk indicators with more missed follow-ups and lower protocol adherence. States in green (like Kerala and Tamil Nadu) show good performance with high visit completion rates and low risk cases.`
      }

      if (selectedElement === "regional-map") {
        if (
          normalizedQuery.includes("explain") ||
          normalizedQuery.includes("what") ||
          normalizedQuery.includes("show")
        ) {
          return `The Regional Performance Map shows maternal health program metrics across all states in India. States are color-coded by risk level: red indicates high-risk areas (like Maharashtra with 72 high-risk cases and 12 missed follow-ups), orange shows medium risk, yellow indicates low risk, and green represents good performance (like Kerala with 97% visit completion). You can click on any state to drill down into detailed analytics.`
        }

        if (normalizedQuery.includes("trend") || normalizedQuery.includes("change")) {
          return `Regional performance varies significantly across India. High-risk states like Uttar Pradesh (95 high-risk cases), Maharashtra (72), and Bihar (58) need immediate attention. Meanwhile, states like Kerala (97% visit completion), Tamil Nadu (95%), and Goa (96%) are performing exceptionally well. The eastern region shows 23% higher risk cases despite similar visit rates, suggesting resource allocation needs adjustment.`
        }

        if (normalizedQuery.includes("improve") || normalizedQuery.includes("recommendation")) {
          return `To improve regional performance, I recommend:\n\n1. Increase resources by 25% in high-risk states (Maharashtra, Uttar Pradesh, Bihar)\n2. Deploy additional field teams to states with high missed follow-ups\n3. Implement state-specific training programs based on local challenges\n4. Create mentorship programs pairing high-performing states with struggling ones\n5. Establish regional coordination centers for better resource distribution`
        }

        return `The Regional Performance Map provides a comprehensive view of our program's geographic impact. Each state shows different performance levels based on visit completion rates, protocol adherence, and risk case distribution. What specific region or metric would you like to explore?`
      }

      if (selectedElement === "key-insights") {
        if (
          normalizedQuery.includes("explain") ||
          normalizedQuery.includes("what") ||
          normalizedQuery.includes("show")
        ) {
          return `The Key Insights panel highlights the most critical issues requiring immediate attention:\n\n1. Maharashtra has 12 high-risk mothers who missed follow-ups and 23% higher risk cases\n2. Team C is underperforming with 76% visit completion for 3 consecutive months\n3. Protocol adherence is declining by 3% monthly, with nutritional assessments down 7.5%\n4. Prenatal vitamins are critically low at 15%, risking stockout in 8 days\n\nThese insights are generated by analyzing patterns across all dashboard metrics.`
        }

        if (normalizedQuery.includes("priority") || normalizedQuery.includes("urgent")) {
          return `Based on urgency and impact, here's the priority order:\n\n1. CRITICAL: Emergency procurement for prenatal vitamins (8 days to stockout)\n2. HIGH: Follow up with 12 missed high-risk mothers in Maharashtra\n3. HIGH: Address Team C's performance issues (3 months below target)\n4. MEDIUM: Implement protocol adherence improvement program\n\nThe supply shortage poses immediate risk to all beneficiaries, while the missed follow-ups could result in serious health complications.`
        }

        return `The Key Insights are automatically generated by analyzing patterns, anomalies, and critical thresholds across all program metrics. These represent the most important issues that need your attention right now. Which insight would you like to discuss in detail?`
      }

      // Default explanation for other charts
      return `The ${elementTitle} chart provides key metrics related to ${elementTitle.toLowerCase()} in our maternal health program. This visualization helps us track performance and identify areas that need attention or improvement.`
    }

    if (
      normalizedQuery.includes("trend") ||
      normalizedQuery.includes("change") ||
      normalizedQuery.includes("over time")
    ) {
      if (selectedElement === "visit-completion") {
        return `Visit completion rates have improved overall by 5% compared to last month. Team D has shown the most improvement, increasing from 90% to 95%. However, Team C has remained stagnant at 76% for the third consecutive month, which is concerning.`
      }

      if (selectedElement === "protocol-adherence") {
        return `Protocol adherence has declined by 3% over the past month, from 79% to 76%. This is part of a concerning downward trend we've observed over the last quarter. Nutritional assessment protocols have seen the largest decline at 7.5%.`
      }

      if (selectedElement === "risk-distribution") {
        return `High-risk cases have increased by 8% from last month (from 131 to 142), which is concerning. Medium-risk cases have remained relatively stable with a 2% increase. The good news is that we've seen a 5% increase in mothers moving from low-risk to healthy status.`
      }

      // Default trend response for other charts
      return `The ${elementTitle.toLowerCase()} metrics have shown some changes over time. Compared to last month, we're seeing variations that require attention, particularly in high-risk areas. Would you like me to analyze a specific aspect of these trends?`
    }

    if (
      normalizedQuery.includes("improve") ||
      normalizedQuery.includes("recommendation") ||
      normalizedQuery.includes("suggest")
    ) {
      if (selectedElement === "visit-completion") {
        return `To improve visit completion rates, I recommend:\n\n1. Targeted training for Team C, which is consistently underperforming at 76%\n2. Pairing Team C members with high performers from Team D for mentorship\n3. Addressing transportation issues, which account for 28% of missed visits\n4. Implementing a mobile reminder system for both field workers and mothers`
      }

      if (selectedElement === "protocol-adherence") {
        return `To improve protocol adherence, I recommend:\n\n1. Refresher training focused specifically on nutritional assessment protocols\n2. Simplifying the protocol documentation process\n3. Creating quick-reference guides for field workers\n4. Implementing a quality check system where 10% of visits are randomly audited\n5. Recognition program for teams with high adherence rates`
      }

      if (selectedElement === "risk-distribution") {
        return `To address the increasing high-risk cases, I recommend:\n\n1. Prioritizing follow-ups for the 142 high-risk mothers, especially the 12 missed follow-ups in Maharashtra\n2. Increasing visit frequency for high and medium-risk mothers to bi-weekly instead of monthly\n3. Enhancing nutritional support programs, which show 3.2x higher correlation to positive outcomes\n4. Implementing specialized training for handling high-risk pregnancies`
      }

      if (selectedElement === "supply-levels") {
        return `To address supply issues, I recommend:\n\n1. Immediate emergency procurement for prenatal vitamins to avoid stockout in 8 days\n2. Implementing a minimum 30% threshold for all critical supplies\n3. Setting up automated reordering when supplies reach the 25% threshold\n4. Reviewing distribution patterns to ensure equitable allocation across regions\n5. Conducting a supply chain audit to identify bottlenecks`
      }

      // Default recommendation for other charts
      return `To improve performance in ${elementTitle.toLowerCase()}, I recommend focusing on data-driven interventions, standardizing protocols, and implementing targeted training programs. Cross-trained teams show 37% higher effectiveness, so knowledge sharing between high and low-performing teams could be beneficial.`
    }

    // Add responses for KPI elements:
    if (selectedElement === "mothers") {
      return `We currently serve 2,853 mothers in our program, which represents a 12% increase from last month. This growth is positive but puts additional strain on our resources. The increase is primarily from new registrations in Maharashtra (185 new), Uttar Pradesh (142 new), and Karnataka (98 new). We need to ensure our field teams and supply chains can handle this growth sustainably.`
    }

    if (selectedElement === "visits") {
      return `Our overall visit completion rate is 87%, which is up 5% from last month and above our target of 85%. However, there's significant variation between teams: Team D leads at 95%, while Team C lags at 76%. The main reasons for missed visits are mother unavailability (45%), staff shortage (32%), and transportation issues (28%). Implementing bi-weekly visits for high-risk mothers could improve outcomes by 42%.`
    }

    if (selectedElement === "protocols") {
      return `Protocol adherence is at 76%, which is concerning as it's down 3% from last month. This represents the third consecutive month of decline. Nutritional assessment protocols show the largest drop at 7.5%, followed by medication reviews at 4.2%. Teams with 90%+ adherence show 65% faster improvement in patient outcomes, highlighting the importance of addressing this decline immediately.`
    }

    if (selectedElement === "risk") {
      return `We have 142 high-risk mothers, representing an 8% increase from last month. The main risk factors are previous complications (41%), hypertension (30%), diabetes (25%), and age-related risks (18%). Geographic distribution shows concentration in Uttar Pradesh (95 cases), Maharashtra (72), and Bihar (58). Our data indicates that bi-weekly visits for high-risk mothers could reduce complications by up to 28%.`
    }

    // Default response for the selected element
    return `Based on the ${elementTitle} data, we're seeing some interesting patterns. Is there something specific about this chart you'd like to understand better? I can explain the metrics, analyze trends, or suggest improvements.`
  }

  // General dashboard responses based on dashboard type
  if (
    normalizedQuery.includes("overview") ||
    normalizedQuery.includes("summary") ||
    normalizedQuery.includes("highlight")
  ) {
    if (dashboardType === "implementation") {
      return `The Implementation Dashboard highlights several key issues:\n\n1. Visit completion is at 87% overall (up 5% from last month)\n2. Protocol adherence has decreased by 3% to 76%\n3. We have 142 high-risk mothers (up 8%)\n4. 12 high-risk mothers have missed follow-ups in Maharashtra\n5. Team C is underperforming with a 76% completion rate\n6. Prenatal vitamins are critically low at 15%, risking stockout in 8 days`
    }

    if (dashboardType === "impact") {
      return `The Impact Dashboard shows positive health outcomes:\n\n1. Maternal mortality reduced by 33% from baseline\n2. Infant mortality reduced by 28% from baseline\n3. Malnutrition prevalence down 37% from baseline\n4. Antenatal care coverage up to 87% (from 65% baseline)\n5. Strongest improvements in the western region\n6. Nutritional protocols show 3.2x higher correlation to positive outcomes than other interventions`
    }

    if (dashboardType === "funder") {
      return `The Funder Dashboard highlights financial metrics:\n\n1. Operating at 92% budget utilization\n2. Cost per beneficiary down to $42 (8% reduction year-over-year)\n3. ROI of $4.20 in social impact value for every $1 invested\n4. Personnel costs account for 45% of budget\n5. Program sustainability index at 105 (above target of 100)\n6. Nutritional Support shows highest outcome score (92) relative to investment`
    }

    if (dashboardType === "usage") {
      return `The Usage Dashboard shows platform adoption metrics:\n\n1. 87% of field workers use the system daily\n2. Visit Logging (92%) and Risk Assessment (88%) are the most used features\n3. Data quality has improved by 15% since implementing validation rules\n4. System response time averages 180ms during peak hours\n5. User feedback shows 4.2/5 average satisfaction\n6. Eastern district shows 7% more data entry errors than other regions`
    }
  }

  if (
    normalizedQuery.includes("risk") ||
    normalizedQuery.includes("high-risk") ||
    normalizedQuery.includes("critical")
  ) {
    return `Currently, we have 142 high-risk mothers in our program, which is an 8% increase from last month. The majority are in Uttar Pradesh (95), Maharashtra (72), and Bihar (58). The main risk factors include previous complications (41%), hypertension (30%), and diabetes (25%). 12 high-risk mothers have missed follow-ups in Maharashtra, which requires immediate attention. Our data shows that increasing visit frequency to bi-weekly for high-risk mothers could reduce complications by up to 28%.`
  }

  if (normalizedQuery.includes("team") || normalizedQuery.includes("performance")) {
    return `Team performance varies significantly across our program:\n\n- Team D is our top performer with 95% visit completion and 90% protocol adherence\n- Team A is performing well with 92% visit completion and 85% protocol adherence\n- Team B is above target with 88% visit completion and 82% protocol adherence\n- Team C is underperforming with 76% visit completion and 70% protocol adherence\n\nTeam C has been below target for 3 consecutive months. Cross-trained teams show 37% higher effectiveness, so pairing Team C members with Team D for mentorship could help improve performance.`
  }

  if (
    normalizedQuery.includes("supply") ||
    normalizedQuery.includes("inventory") ||
    normalizedQuery.includes("stock")
  ) {
    return `Current supply levels show some critical shortages:\n\n- Prenatal vitamins are at 15% (below our 20% threshold), risking stockout in 8 days\n- Iron supplements are at 42% (adequate)\n- Folic acid is at 38% (adequate)\n- Malaria prevention supplies are at 65% (well-stocked)\n- Nutritional supplements are at 27% (adequate but monitoring)\n\nWe need to initiate emergency procurement for prenatal vitamins immediately to avoid disruption to the program.`
  }

  if (
    normalizedQuery.includes("recommend") ||
    normalizedQuery.includes("suggest") ||
    normalizedQuery.includes("improve")
  ) {
    return `Based on current dashboard data, here are my top recommendations:\n\n1. Prioritize follow-ups for 12 missed high-risk mothers in Maharashtra\n2. Initiate emergency procurement for prenatal vitamins (15% stock, 8 days to stockout)\n3. Implement targeted training for Team C (76% visit completion, below target for 3 months)\n4. Increase visit frequency to bi-weekly for all high-risk mothers (could reduce complications by 28%)\n5. Focus on nutritional assessment protocols (7.5% decline in adherence)\n6. Expand cross-training program (37% higher effectiveness in cross-trained teams)`
  }

  // Default response based on dashboard type
  const responses: Record<DashboardType, string> = {
    implementation:
      "The Implementation Dashboard shows our program execution metrics. Visit completion rates are at 87% (up 5% from last month), but protocol adherence has decreased by 3%. We have 142 high-risk mothers with 12 missed follow-ups in the eastern district that need attention. What specific aspect would you like to explore further?",
    impact:
      "The Impact Dashboard shows our health outcome metrics. We've seen maternal mortality reduced by 33% from baseline and malnutrition prevalence down 37%. The western region shows the strongest improvements. What specific impact metrics would you like to learn more about?",
    funder:
      "The Funder Dashboard shows our financial metrics. We're operating at 92% budget utilization with a cost per beneficiary of $42 (down 8% year-over-year). Our ROI is $4.20 in social impact value for every $1 invested. What financial aspects would you like to explore?",
    usage:
      "The Usage Dashboard shows platform adoption metrics. 87% of field workers use the system daily, with Visit Logging (92%) and Risk Assessment (88%) being the most used features. Data quality has improved by 15% since implementing validation rules. What usage metrics are you interested in?",
  }

  return (
    responses[dashboardType] ||
    "I'm here to help you understand the dashboard data. You can ask specific questions about trends, metrics, or recommendations based on what you see."
  )
}
