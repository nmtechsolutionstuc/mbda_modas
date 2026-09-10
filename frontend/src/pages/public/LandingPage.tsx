import { useState, useEffect } from 'react'
import { getPublicLanding, type LandingContent } from '../../api/public'
import { HomeNavbar } from '../../components/home/HomeNavbar'
import { HomeHero } from '../../components/home/HomeHero'
import { HomeBenefits, type Pillar } from '../../components/home/HomeBenefits'
import { HomeProcess, type ProcessStep } from '../../components/home/HomeProcess'
import { HomeCollection } from '../../components/home/HomeCollection'
import { HomeResellerStory } from '../../components/home/HomeResellerStory'
import { HomeTestimonials } from '../../components/home/HomeTestimonials'
import { HomeFAQ } from '../../components/home/HomeFAQ'
import { HomeCTA } from '../../components/home/HomeCTA'

// ── Defaults (usados mientras carga o si falla la API) ────────────────────────

const DEFAULTS: LandingContent = {
  landingHeroTitle:    'Creá tu tienda, sin invertir un peso',
  landingHeroSubtitle: 'Armá tu catálogo gratis',
  landingHeroDesc:     'Elegí productos de MBDA Modas, ponele tu precio y vendé a tus clientes. Sin stock, sin local, sin costo de entrada.',
  landingCta1Text:     'Quiero ser revendedora',
  landingCta2Text:     'Ya tengo cuenta',
  landingHowTitle:     'Todo lo que necesitás para vender, ya está resuelto',
  landingStep1Title:   'Registrate gratis',
  landingStep1Desc:    'Creá tu cuenta en minutos. Sin costo, sin compromisos, sin stock que comprar por adelantado.',
  landingStep2Title:   'Armá tu catálogo',
  landingStep2Desc:    'Elegí los productos de MBDA Modas que quieras vender y definí tu propio precio de venta.',
  landingStep3Title:   'Compartí y vendé',
  landingStep3Desc:    'Compartí tu link único por WhatsApp o redes, y recibí pedidos directo de tus clientas.',
  landingHeroImage:    null,
  landingHeroVideo:    null,
  landingAboutText:    'Creamos una forma simple de emprender: vos elegís qué vender y a qué precio, MBDA se encarga del stock. Sin locales, sin inversión, sin vueltas.',
  landingManifesto:    'Creá tu emprendimiento de moda sin invertir un peso. Elegís los productos, ponés tu precio, nosotros nos ocupamos del resto.',
  landingFeaturesImage: null,
  landingStep1Video:   null,
  landingStep2Video:   null,
  landingStep3Video:   null,
  landingBenefit1Title: 'Precios mayoristas',
  landingBenefit1Desc:  'Accedé al catálogo de MBDA al precio de fábrica y definí vos cuánto ganás en cada venta.',
  landingBenefit2Title: 'Catálogo siempre actualizado',
  landingBenefit2Desc:  'Nuevos productos y colecciones disponibles para sumar a tu selección cuando quieras.',
  landingBenefit3Title: 'Pedidos simples y directos',
  landingBenefit3Desc:  'Cargás la reserva, MBDA confirma el pago y se encarga de tenerlo listo para tu clienta.',
  landingBenefit4Title: 'Acompañamiento real',
  landingBenefit4Desc:  'No estás sola: hay soporte para resolver dudas en cada paso de tu emprendimiento.',
  landingShowBenefits: true,
  landingShowProcess: true,
  landingShowCollection: true,
  landingShowResellerStory: true,
  landingShowTestimonials: true,
  landingShowFaq: true,
}

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3000'
function imageUrl(p: string) {
  return p.startsWith('http') ? p : `${API_BASE}${p}`
}

const HERO_SENTINEL_ID = 'home-hero-sentinel'

// ── Página principal ──────────────────────────────────────────────────────────

export function LandingPage() {
  const [content, setContent] = useState<LandingContent>(DEFAULTS)

  useEffect(() => {
    getPublicLanding()
      .then(c => { if (c) setContent(c) })
      .catch(() => { /* silencioso, usa defaults */ })
  }, [])

  const titleParts = content.landingHeroTitle.split(',')
  const heroLine1 = titleParts[0]!
  const heroLine2 = titleParts.length >= 2 ? titleParts.slice(1).join(',').trim() : null

  const steps: ProcessStep[] = [
    { title: content.landingStep1Title, desc: content.landingStep1Desc, videoUrl: content.landingStep1Video },
    { title: content.landingStep2Title, desc: content.landingStep2Desc, videoUrl: content.landingStep2Video },
    { title: content.landingStep3Title, desc: content.landingStep3Desc, videoUrl: content.landingStep3Video },
  ]

  const pillars: Pillar[] = [
    { title: content.landingBenefit1Title, desc: content.landingBenefit1Desc },
    { title: content.landingBenefit2Title, desc: content.landingBenefit2Desc },
    { title: content.landingBenefit3Title, desc: content.landingBenefit3Desc },
    { title: content.landingBenefit4Title, desc: content.landingBenefit4Desc },
  ]

  return (
    <div className="bg-[var(--land-cream)]">
      <HomeNavbar
        ctaText={content.landingCta1Text}
        loginText={content.landingCta2Text}
        heroSentinelId={HERO_SENTINEL_ID}
        showBenefits={content.landingShowBenefits}
        showProcess={content.landingShowProcess}
        showCollection={content.landingShowCollection}
        showFaq={content.landingShowFaq}
      />

      <HomeHero
        heroLine1={heroLine1}
        heroLine2={heroLine2}
        desc={content.landingHeroDesc}
        ctaText={content.landingCta1Text}
        image={content.landingHeroImage ? imageUrl(content.landingHeroImage) : null}
        video={content.landingHeroVideo ? imageUrl(content.landingHeroVideo) : null}
        sentinelId={HERO_SENTINEL_ID}
      />

      {content.landingShowBenefits && <HomeBenefits aboutText={content.landingAboutText} pillars={pillars} />}

      {content.landingShowProcess && <HomeProcess title={content.landingHowTitle} steps={steps} />}

      {content.landingShowCollection && <HomeCollection />}

      {content.landingShowResellerStory && (
        <HomeResellerStory
          manifesto={content.landingManifesto}
          backgroundImage={content.landingFeaturesImage ? imageUrl(content.landingFeaturesImage) : null}
        />
      )}

      {content.landingShowTestimonials && <HomeTestimonials />}

      {content.landingShowFaq && <HomeFAQ />}

      <HomeCTA ctaText={content.landingCta1Text} />
    </div>
  )
}
