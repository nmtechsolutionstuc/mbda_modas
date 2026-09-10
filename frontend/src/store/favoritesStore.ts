import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface FavoriteItem {
  variantId: string
  catalogItemId: string
  productId: string
  name: string
  photo: string | null
  price: number
  color: string
  size: string
}

interface FavoritesState {
  byStore: Record<string, FavoriteItem[]>
  add: (storeSlug: string, item: FavoriteItem) => void
  remove: (storeSlug: string, variantId: string) => void
  clear: (storeSlug: string) => void
  isFavorite: (storeSlug: string, variantId: string) => boolean
  getItems: (storeSlug: string) => FavoriteItem[]
}

// Referencia estable para tiendas sin favoritos — un array nuevo en cada llamada
// rompe la comparación referencial de useSyncExternalStore y genera un loop infinito.
const EMPTY_ITEMS: FavoriteItem[] = []

/** Favoritos ("Mi selección") por tienda, persistidos en localStorage — no hay carrito tradicional. */
export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      byStore: {},

      add: (storeSlug, item) => set(state => {
        const current = state.byStore[storeSlug] ?? []
        if (current.some(i => i.variantId === item.variantId)) return state
        return { byStore: { ...state.byStore, [storeSlug]: [...current, item] } }
      }),

      remove: (storeSlug, variantId) => set(state => ({
        byStore: {
          ...state.byStore,
          [storeSlug]: (state.byStore[storeSlug] ?? []).filter(i => i.variantId !== variantId),
        },
      })),

      clear: (storeSlug) => set(state => ({ byStore: { ...state.byStore, [storeSlug]: [] } })),

      isFavorite: (storeSlug, variantId) => (get().byStore[storeSlug] ?? []).some(i => i.variantId === variantId),

      getItems: (storeSlug) => get().byStore[storeSlug] ?? EMPTY_ITEMS,
    }),
    {
      name: 'mbda-favorites',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
