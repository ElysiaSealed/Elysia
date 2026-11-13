// Run from: ROOT/apps/web  ->  node scripts/og-image.mjs
// Renders public/og-image.png (1200x630) from a self-contained template.
// Text-only placeholder: no logo or brand asset is used until an official ELYSIA logo exists (pending).
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const OUT = resolve('public/og-image.png')
mkdirSync(resolve('public'), { recursive: true })

const browser = await chromium.launch({ channel: process.env.PW_CHANNEL ?? 'msedge' })
try {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
  const page = await ctx.newPage()
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;600&family=Geist+Mono:wght@400&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
<style>
:root{--bg:#0A0A0A;--ink:#F2EFEA;--ink-3:#6E6A66;--green:#8CFF61;--green-2:#B4FF98;
--sans:"Geist",system-ui,sans-serif;--mono:"Geist Mono",ui-monospace,monospace;--serif:"Instrument Serif",Georgia,serif}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1200px;height:630px;background:var(--bg);overflow:hidden}
body{position:relative;color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased;
background:radial-gradient(ellipse 60% 70% at 85% 50%,rgba(140,255,97,.16),rgba(10,10,10,0) 70%),var(--bg)}
.name{position:absolute;left:72px;top:60px;font-weight:600;font-size:26px;letter-spacing:.06em}
h1{position:absolute;left:72px;top:200px;font-weight:300;font-size:92px;line-height:1.0;letter-spacing:-.045em}
h1 em{display:block;margin-top:14px;font-family:var(--serif);font-style:italic;font-weight:400;font-size:70px;letter-spacing:-.01em;color:var(--green-2)}
.foot{position:absolute;left:72px;bottom:56px;font-family:var(--mono);font-size:16px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-3)}
</style></head><body>
<div class="name">ELYSIA</div>
<h1>AI analyst<br>on Robinhood Chain.<em>Sealed.</em></h1>
<div class="foot">Not affiliated with Robinhood</div>
</body></html>`)
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(800)
  const fontsOk = await page.evaluate(
    () => document.fonts.check('300 40px Geist') && document.fonts.check('italic 40px "Instrument Serif"') && document.fonts.check('16px "Geist Mono"'),
  )
  if (!fontsOk) throw new Error('design fonts (Geist / Instrument Serif / Geist Mono) failed to load; check the network connection')
  writeFileSync(OUT, await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } }))
  console.log('written:', OUT)
} finally {
  await browser.close()
}
