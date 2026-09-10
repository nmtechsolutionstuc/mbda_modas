// Paletas + tipografías que una revendedora puede elegir para su tienda pública
// y su propio panel. Se usa en StorePage.tsx / PanelLayout.tsx (aplicarlo) y en
// MyProfilePage.tsx (elegirlo).

import type { CSSProperties } from 'react'

export type StoreThemeKey = 'ELEGANTE' | 'VARONIL' | 'NARANJA' | 'ROSA' | 'MINIMAL'

export interface StoreThemeDef {
  label: string
  desc: string
  colors: {
    surface: string
    bannerFrom: string
    bannerTo: string
    soft: string
    softAlt: string
    line: string
    ink: string
    inkSoft: string
    muted: string
    accent: string
    accentDark: string
  }
  fonts: {
    display: string
    body: string
  }
}

export const STORE_THEMES: Record<StoreThemeKey, StoreThemeDef> = {
  ELEGANTE: {
    label: 'Elegante',
    desc: 'Crema y terracota, serif clásica',
    colors: {
      surface: '#FFFFFF', bannerFrom: '#EFE3D6', bannerTo: '#F7EFE7',
      soft: '#F6EBDF', softAlt: '#F0E2D3', line: '#E8D5BE',
      ink: '#2B1B12', inkSoft: '#6B5B4E', muted: '#9C8770',
      accent: '#C4693F', accentDark: '#A6532E',
    },
    fonts: { display: "'Libre Caslon Text', Georgia, serif", body: "'Jost', system-ui, sans-serif" },
  },
  VARONIL: {
    label: 'Azul',
    desc: 'Celeste y azul profundo, serif con carácter',
    colors: {
      surface: '#FFFFFF', bannerFrom: '#DCE7F2', bannerTo: '#F0F6FA',
      soft: '#EAF1F7', softAlt: '#DEE9F2', line: '#C9D9E6',
      ink: '#1B2836', inkSoft: '#4A5C6E', muted: '#7E93A6',
      accent: '#2B5A8C', accentDark: '#1F4266',
    },
    fonts: { display: "'Playfair Display', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  },
  NARANJA: {
    label: 'Naranja vibrante',
    desc: 'Blanco y naranja intenso, serif moderna',
    colors: {
      surface: '#FFFFFF', bannerFrom: '#FCE0CC', bannerTo: '#FFF3EA',
      soft: '#FFF1E6', softAlt: '#FCDEC8', line: '#FBCBA3',
      ink: '#2B1B12', inkSoft: '#7A5233', muted: '#B3805C',
      accent: '#E8672B', accentDark: '#C4531F',
    },
    fonts: { display: "'DM Serif Display', Georgia, serif", body: "'Jost', system-ui, sans-serif" },
  },
  ROSA: {
    label: 'Rosa',
    desc: 'Blush y rosa antiguo, serif delicada',
    colors: {
      surface: '#FFFFFF', bannerFrom: '#F5E1E6', bannerTo: '#FBF0F2',
      soft: '#FBEEF1', softAlt: '#F6DFE6', line: '#EAD0D8',
      ink: '#3A2530', inkSoft: '#6E4E58', muted: '#A3808C',
      accent: '#C9738A', accentDark: '#AD5A70',
    },
    fonts: { display: "'Cormorant Garamond', Georgia, serif", body: "'Jost', system-ui, sans-serif" },
  },
  MINIMAL: {
    label: 'Minimal',
    desc: 'Blanco y negro, italic serif + sans limpia',
    colors: {
      surface: '#FFFFFF', bannerFrom: '#ECECEC', bannerTo: '#F7F7F7',
      soft: '#F5F5F5', softAlt: '#EBEBEB', line: '#DFDFDF',
      ink: '#111111', inkSoft: '#4B4B4B', muted: '#8A8A8A',
      accent: '#111111', accentDark: '#000000',
    },
    fonts: { display: "'Instrument Serif', Georgia, serif", body: "'Inter', system-ui, sans-serif" },
  },
}

export const STORE_THEME_ORDER: StoreThemeKey[] = ['ELEGANTE', 'VARONIL', 'NARANJA', 'ROSA', 'MINIMAL']

/**
 * Vuelca la paleta + tipografía de un tema como variables CSS — se aplican una
 * sola vez en el nodo raíz (tienda pública o layout del panel) y todo lo de
 * adentro que referencie var(--c-xxx)/var(--f-xxx) las hereda sin prop drilling.
 */
export function themeCssVars(theme: StoreThemeKey): CSSProperties {
  const t = STORE_THEMES[theme]
  return {
    '--c-page': '#FFFFFF',
    '--c-surface': t.colors.surface,
    '--c-bannerFrom': t.colors.bannerFrom,
    '--c-bannerTo': t.colors.bannerTo,
    '--c-soft': t.colors.soft,
    '--c-softAlt': t.colors.softAlt,
    '--c-line': t.colors.line,
    '--c-ink': t.colors.ink,
    '--c-inkSoft': t.colors.inkSoft,
    '--c-muted': t.colors.muted,
    '--c-accent': t.colors.accent,
    '--c-accentDark': t.colors.accentDark,
    '--f-display': t.fonts.display,
    '--f-body': t.fonts.body,
  } as CSSProperties
}
