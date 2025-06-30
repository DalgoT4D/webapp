import { createAppStore } from '@/lib/zustand'

export interface Org {
  slug: string
  name: string
  viz_url: string
}

interface AuthState {
  // State
  token: string | null
  selectedOrg: string | null
  isAuthenticated: boolean
  
  // Actions
  setToken: (token: string) => void
  setSelectedOrg: (orgSlug: string) => void
  logout: () => void
  initialize: () => void
}

export const useAuthStore = createAppStore<AuthState>(
  (set, get) => ({
    // Initial state
    token: null,
    selectedOrg: null,
    isAuthenticated: false,

    // Actions
    setToken: (token: string) => {
      localStorage.setItem('authToken', token)
      set({ token, isAuthenticated: true })
    },

    setSelectedOrg: (orgSlug: string) => {
      localStorage.setItem('selectedOrg', orgSlug)
      set({ selectedOrg: orgSlug })
    },

    logout: () => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('selectedOrg')
      set({ token: null, selectedOrg: null, isAuthenticated: false })
    },

    initialize: () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('authToken')
        const selectedOrg = localStorage.getItem('selectedOrg')
        
        if (token) {
          set({ 
            token, 
            selectedOrg, 
            isAuthenticated: true 
          })
        }
      }
    },
  }),
  {
    name: 'auth-store',
    persist: false, // We handle persistence manually for better control
    devtools: true,
  }
) 