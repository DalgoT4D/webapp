'use client'

import { SWRConfig } from 'swr'
import { ReactNode } from 'react'
import { apiGet } from './api'

// Use existing API infrastructure for SWR fetcher
const defaultFetcher = (url: string) => {
  return apiGet(url)
}

// Production-ready SWR configuration
const swrConfig = {
  fetcher: defaultFetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 2000,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  loadingTimeout: 10000,
  onError: (error: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('SWR Error:', error)
    }
  },
}

interface SWRProviderProps {
  children: ReactNode
}

export function SWRProvider({ children }: SWRProviderProps) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>
} 