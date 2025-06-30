"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { DashboardBuilder } from "@/components/dashboard/dashboard-builder"

export default function CreateDashboardPage() {
  return (
    <MainLayout>
      <div className="flex flex-col h-full">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold tracking-tight">Create Dashboard</h1>
          <p className="text-muted-foreground">Build a custom dashboard using drag and drop</p>
        </div>
        <div className="flex-1 overflow-hidden">
          <DashboardBuilder />
        </div>
      </div>
    </MainLayout>
  )
} 