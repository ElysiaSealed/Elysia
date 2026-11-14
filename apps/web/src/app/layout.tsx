import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import '@/styles/tokens.css'
import '@/styles/landing.css'
import '@/styles/pages.css'
import '@/styles/splash.css'
import { Splash } from '@/components/Splash'
import { SITE_URL, X_HANDLE } from '@/lib/site'

const TITLE = 'ELYSIA: AI analyst on Robinhood Chain'
const DESCRIPTION =
  'ELYSIA is an AI agent that reads Pons V2 launches and Stock Tokens on Robinhood Chain and commits each call on-chain before it is published. Not affiliated with Robinhood.'
const OG_TITLE = 'ELYSIA: sealed before it speaks'
const OG_DESCRIPTION =
  'An AI agent that commits each assessment on-chain before publishing it. Not affiliated with Robinhood.'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/' },
  // Favicon: app/icon.png and app/apple-icon.png (official ELYSIA logo), picked up by the Next.js file convention.
  openGraph: {
    type: 'website',
    siteName: 'ELYSIA',
    title: OG_TITLE,
    description: OG_DESCRIPTION,
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    ...(X_HANDLE ? { site: `@${X_HANDLE}` } : {}),
    title: OG_TITLE,
    description: OG_DESCRIPTION,
  },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#0A0A0A' }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Splash screen trigger: skip if user prefers reduced motion or already loaded in current session */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement,n=performance.getEntriesByType('navigation')[0],r=n&&n.type==='reload';if(matchMedia('(prefers-reduced-motion: reduce)').matches||(!r&&(sessionStorage.getItem('elysia_splash'))))d.dataset.splash='skip'}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Typography fonts: Geist, Geist Mono, Instrument Serif */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Splash />
        {children}
      </body>
    </html>
  )
}
