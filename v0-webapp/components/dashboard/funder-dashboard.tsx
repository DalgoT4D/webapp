import { ErrorBoundary } from "react-error-boundary"
import { DashboardChartWrapper } from "./dashboard-chart-wrapper"
import { BudgetUtilizationChart } from "./budget-utilization-chart"
import { CostPerBeneficiaryChart } from "./cost-per-beneficiary-chart"
import { OutcomesByInvestmentChart } from "./outcomes-by-investment-chart"
import { FundingAllocationTable } from "./funding-allocation-table"
import { ProgramSustainabilityChart } from "./program-sustainability-chart"

interface FunderDashboardProps {
  onElementSelect: (elementId: string) => void
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-base font-bold text-red-800">Chart Error:</h2>
      <p className="text-sm text-red-600">{error.message}</p>
    </div>
  )
}

export function FunderDashboard({ onElementSelect }: FunderDashboardProps) {
  // Ensure we have a valid onElementSelect function
  const handleElementSelect = (elementId: string) => {
    if (onElementSelect && typeof onElementSelect === "function" && elementId) {
      onElementSelect(elementId)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Budget Utilization */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="budget-utilization"
          title="Budget Utilization"
          onElementSelect={handleElementSelect}
        >
          <BudgetUtilizationChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Cost Per Beneficiary */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="cost-per-beneficiary"
          title="Cost Per Beneficiary"
          onElementSelect={handleElementSelect}
        >
          <CostPerBeneficiaryChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Outcomes By Investment */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="outcomes-by-investment"
          title="Outcomes By Investment"
          onElementSelect={handleElementSelect}
        >
          <OutcomesByInvestmentChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Program Sustainability */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="program-sustainability"
          title="Program Sustainability"
          onElementSelect={handleElementSelect}
          className="lg:col-span-3"
        >
          <ProgramSustainabilityChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Funding Allocation */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="funding-allocation"
          title="Funding Allocation"
          onElementSelect={handleElementSelect}
          className="lg:col-span-3"
        >
          <FundingAllocationTable />
        </DashboardChartWrapper>
      </ErrorBoundary>
    </div>
  )
}
