import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'ELYSIA: sealed before it speaks'

/** Link preview image: official logo, name and tagline on the site background. */
export default async function OgImage() {
  const logo = `data:image/png;base64,${(await readFile(join(process.cwd(), 'public', 'logo.png'))).toString('base64')}`
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 96, background: '#0A0A0A', color: '#F2EFEA' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logo} width={120} height={120} alt="" />
        <div style={{ fontSize: 96, fontWeight: 600, marginTop: 40 }}>ELYSIA</div>
        <div style={{ fontSize: 40, color: '#8cff61', marginTop: 12 }}>Sealed before it speaks.</div>
        <div style={{ fontSize: 28, color: '#9a9a9a', marginTop: 28 }}>AI analyst on Robinhood Chain. Not affiliated with Robinhood.</div>
      </div>
    ),
    size,
  )
}
