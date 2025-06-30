import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { StateCreator } from 'zustand'

// Production-ready Zustand store creator with middleware
export const createAppStore = <T>(
  storeCreator: StateCreator<T, [], [], T>,
  options?: {
    name?: string
    persist?: boolean
    devtools?: boolean
  }
) => {
  const { 
    name = 'app-store', 
    persist: enablePersist = false, 
    devtools: enableDevtools = process.env.NODE_ENV === 'development' 
  } = options || {}

  if (enablePersist && enableDevtools) {
    return create<T>()(
      devtools(
        persist(storeCreator, {
          name,
          storage: createJSONStorage(() => localStorage),
        }),
        { name }
      )
    )
  }

  if (enablePersist) {
    return create<T>()(
      persist(storeCreator, {
        name,
        storage: createJSONStorage(() => localStorage),
      })
    )
  }

  if (enableDevtools) {
    return create<T>()(devtools(storeCreator, { name }))
  }

  return create<T>()(storeCreator)
} 