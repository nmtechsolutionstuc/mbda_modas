import { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router'

import { getPublicStore, type PublicStore, type StoreProduct } from '../../api/public'
import { useFavoritesStore } from '../../store/favoritesStore'
import { themeCssVars } from '../../theme/storeThemes'
import { StoreGlobalStyles } from '../../components/store/StoreGlobalStyles'
import { StoreNav } from '../../components/store/StoreNav'
import { StoreCover } from '../../components/store/StoreCover'
import { StoreMarquee } from '../../components/store/StoreMarquee'
import { StoreLookbook } from '../../components/store/StoreLookbook'
import { StoreProductDrawer } from '../../components/store/StoreProductDrawer'
import { StoreFavoritesDrawer } from '../../components/store/StoreFavoritesDrawer'
import { StoreHowToBuy } from '../../components/store/StoreHowToBuy'
import { StoreTrust } from '../../components/store/StoreTrust'
import { StoreFooter } from '../../components/store/StoreFooter'
import { C, F } from '../../components/store/tokens'

const COVER_SENTINEL_ID = 'store-cover-sentinel'

export function StorePage() {
  const { slug } = useParams<{ slug: string }>()
  const [store, setStore] = useState<PublicStore | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [detailProduct, setDetailProduct] = useState<StoreProduct | null>(null)
  const [showFavorites, setShowFavorites] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState('')

  const favCount = useFavoritesStore(s => (slug ? (s.byStore[slug]?.length ?? 0) : 0))

  useEffect(() => {
    if (!slug) return
    getPublicStore(slug)
      .then(setStore)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const productList = useMemo(() => store?.products ?? [], [store])
  const filteredProducts = useMemo(
    () => categoryFilter ? productList.filter(p => p.category.id === categoryFilter) : productList,
    [productList, categoryFilter],
  )

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Cargando...</div>
  }
  if (notFound || !store) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
        <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>Tienda no encontrada</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    )
  }

  return (
    <div style={{ ...themeCssVars(store.reseller.storeTheme), background: C.page, minHeight: '100vh', fontFamily: F.body, color: C.ink }}>
      <StoreGlobalStyles />
      <StoreNav
        storeName={store.reseller.storeName}
        whatsapp={store.reseller.whatsapp}
        favCount={favCount}
        onOpenFavorites={() => setShowFavorites(true)}
        coverSentinelId={COVER_SENTINEL_ID}
      />
      <StoreCover
        storeName={store.reseller.storeName}
        storeBio={store.reseller.storeBio}
        storePhoto={store.reseller.storePhoto}
        city={store.reseller.city}
        whatsapp={store.reseller.whatsapp}
        sentinelId={COVER_SENTINEL_ID}
      />

      <StoreMarquee />
      <StoreLookbook
        products={filteredProducts}
        storeSlug={store.reseller.storeSlug}
        onOpenDetail={setDetailProduct}
        categories={store.categories}
        selectedCategory={categoryFilter}
        onCategoryChange={setCategoryFilter}
        hasProductsAtAll={productList.length > 0}
      />
      <StoreHowToBuy store={store} />
      <StoreTrust />
      <StoreFooter store={store} />

      {detailProduct && <StoreProductDrawer product={detailProduct} store={store} onClose={() => setDetailProduct(null)} />}
      {showFavorites && <StoreFavoritesDrawer store={store} onClose={() => setShowFavorites(false)} />}
    </div>
  )
}
