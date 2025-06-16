// _client/stores/useArchiveStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ArchiveStore {
  counts: Record<string, number>
  setCounts: (feature: string, count: number) => void
}

export const useArchiveStore = create<ArchiveStore>()(
  persist(
    (set) => ({
      counts: {},

      setCounts: (feature: string, count: number) => {
        set((state) => ({
          counts: { ...state.counts, [feature]: count }
        }))
      }
    }),
    {
      name: 'archive-store'
    }
  )
)