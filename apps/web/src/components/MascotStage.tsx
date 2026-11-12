'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Animated ELYSIA mascot stage.
 * The frames in /mascot are one continuous take. The head and eyes follow the cursor:
 *   cursor left / right -> the head turns left / right
 *   cursor up / down    -> the eyes look up / down
 * Each axis is an ordered list of frames from its negative end (left, up) to its positive end (right, down).
 * Exactly one real frame is drawn at a time (the nearest one): blending frames leaves a ghost of the face.
 * Smoothness comes from the frame density and from soft, velocity-clamped easing of the gaze.
 */

const range = (from: number, to: number): number[] => {
  const step = from <= to ? 1 : -1
  const out: number[] = []
  for (let f = from; f !== to + step; f += step) out.push(f)
  return out
}

// Frames 1-37: eyes down. 63-79: eyes up. 81-109: head turns right. 181 back to 153: head turns left.
// Frames 40-52 (eyes closing) and 141-149 (eyes closed) are skipped on purpose.
const X_NEG = range(153, 181) // extreme left .. neutral
const X_POS = range(81, 109) // neutral .. extreme right
const Y_NEG = range(63, 79) // extreme up .. neutral
const Y_POS = range(1, 37) // neutral .. extreme down
const AXIS_X = [...X_NEG, ...X_POS]
const AXIS_Y = [...Y_NEG, ...Y_POS]

const CENTER_FRAME = 1

// Pointer physics
const MAX_VELOCITY = 0.036 // max axis step per tick (60FPS) so fast flicks do not skip poses
const DAMPING_FACTOR = 0.045 // soft natural inertia
const DEAD_ZONE = 0.05
const AXIS_SWITCH_MARGIN = 0.12 // how much the other axis must lead before the pose switches

const NATIVE_WIDTH = 1280
const NATIVE_HEIGHT = 720

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)
const frameSrc = (n: number) => `/mascot/frame_${String(n).padStart(4, '0')}.webp`

/** Axis position in [-1, 1] -> index into the axis frame list. Neutral sits at the join of both halves. */
const axisIndex = (p: number, nNeg: number, nPos: number) => Math.round(p < 0 ? (1 + p) * (nNeg - 1) : nNeg - 1 + p * nPos)

export function MascotStage() {
  const root = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const haloRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const embersRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const el = root.current
    const bodyEl = bodyRef.current
    const haloEl = haloRef.current
    const cv = embersRef.current
    const canvas = canvasRef.current
    if (!el || !bodyEl || !cv || !canvas) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) return

    // 1. Preload the frames used by both axes into memory
    const images: Map<number, HTMLImageElement> = new Map()
    let loadedCount = 0

    const onLoadFrame = (frameNum: number) => {
      loadedCount++
      if (frameNum === CENTER_FRAME || loadedCount >= 8) setIsLoaded(true)
    }

    const load = (fNum: number) => {
      if (images.has(fNum)) return
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => onLoadFrame(fNum)
      img.src = frameSrc(fNum)
      images.set(fNum, img)
    }

    // Priority: neutral poses and the extremes of each axis, then everything else
    const priority = [CENTER_FRAME, 181, 81, 79, 153, 109, 63, 37]
    for (const fNum of priority) load(fNum)
    for (const fNum of [...AXIS_X, ...AXIS_Y]) load(fNum)

    // Pointer tracking: target and current gaze in [-1, 1] on both axes
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let lastMoveTime = performance.now()

    const deadZone = (v: number) => Math.sign(v) * (Math.max(0, Math.abs(v) - DEAD_ZONE) / (1 - DEAD_ZONE))

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      if (r.width <= 0 || r.height <= 0 || window.innerWidth <= 0 || window.innerHeight <= 0) return
      // Measure from the face (upper-middle of the canvas) so "left of her" really means left
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.4
      target.x = deadZone(clamp((e.clientX - cx) / (window.innerWidth * 0.4), -1, 1))
      target.y = deadZone(clamp((e.clientY - cy) / (window.innerHeight * 0.4), -1, 1))
      lastMoveTime = performance.now()
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const onMouseLeave = () => {
      // Gently return the gaze to the center when the cursor leaves the window
      target.x = 0
      target.y = 0
    }
    window.addEventListener('mouseleave', onMouseLeave)

    // Embers Canvas Resizing
    const ctx = cv.getContext('2d')
    let w = 0
    let h = 0

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const r = cv.getBoundingClientRect()
      w = r.width
      h = r.height
      cv.width = w * dpr
      cv.height = h * dpr
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // Ambient floating particles behind character
    type P = { x: number; y: number; vx: number; vy: number; r: number; life: number; max: number }
    const spawn = (): P => {
      const isLeft = Math.random() < 0.5
      const px = isLeft ? Math.random() * w * 0.35 : w * (0.65 + Math.random() * 0.35)
      return {
        x: Math.random() < 0.25 ? Math.random() * w : px,
        y: h * (0.4 + Math.random() * 0.6),
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.2 + Math.random() * 0.6),
        r: 0.8 + Math.random() * 1.6,
        life: 0,
        max: 140 + Math.random() * 180,
      }
    }
    const ps: P[] = Array.from({ length: 32 }, () => {
      const p = spawn()
      p.life = Math.random() * p.max
      return p
    })

    // Animation & Physics Loop (60FPS / 120FPS)
    let raf = 0
    const mainCtx = canvas.getContext('2d', { alpha: true })
    const start = performance.now()

    // Only one axis is shown at a time; a margin stops it flickering near the diagonal.
    let axis: 'x' | 'y' = 'x'

    const tick = (now: number) => {
      const t = (now - start) / 1000

      // Auto-idle: after 3.5s a slow, small sway around the center
      const isIdle = now - lastMoveTime > 3500
      const goalX = isIdle ? Math.sin(t * 0.45) * 0.12 : target.x
      const goalY = isIdle ? 0 : target.y

      // Physics: ease toward the goal with a velocity clamp
      current.x += clamp((goalX - current.x) * DAMPING_FACTOR, -MAX_VELOCITY, MAX_VELOCITY)
      current.y += clamp((goalY - current.y) * DAMPING_FACTOR, -MAX_VELOCITY, MAX_VELOCITY)

      // The dominant axis (with a hysteresis margin) decides which pose is shown
      const ax = Math.abs(current.x)
      const ay = Math.abs(current.y)
      if (axis === 'x' && ay > ax + AXIS_SWITCH_MARGIN) axis = 'y'
      else if (axis === 'y' && ax > ay + AXIS_SWITCH_MARGIN) axis = 'x'

      if (mainCtx) {
        const cr = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const cw = cr.width
        const ch = cr.height

        if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
          canvas.width = Math.round(cw * dpr)
          canvas.height = Math.round(ch * dpr)
        }

        // A frame that has not loaded yet falls back to the nearest loaded neighbour on the same axis
        const imageAt = (frames: number[], i: number): HTMLImageElement | null => {
          for (let dist = 0; dist <= 6; dist++) {
            for (const j of [i - dist, i + dist]) {
              const frame = frames[clamp(j, 0, frames.length - 1)]
              const img = frame === undefined ? undefined : images.get(frame)
              if (img && img.complete && img.naturalWidth > 0) return img
            }
          }
          return null
        }

        const index = axis === 'x' ? axisIndex(current.x, X_NEG.length, X_POS.length) : axisIndex(current.y, Y_NEG.length, Y_POS.length)
        const img = imageAt(axis === 'x' ? AXIS_X : AXIS_Y, index)

        if (img) {
          mainCtx.save()
          mainCtx.scale(dpr, dpr)
          mainCtx.clearRect(0, 0, cw, ch)
          // Aspect cover calculations with bias toward the face
          const imgRatio = img.naturalWidth / img.naturalHeight
          const canvasRatio = cw / ch
          let renderWidth = cw
          let renderHeight = ch
          let offsetX = 0
          let offsetY = 0
          if (canvasRatio > imgRatio) {
            renderWidth = cw
            renderHeight = cw / imgRatio
            offsetY = (ch - renderHeight) * 0.18
          } else {
            renderHeight = ch
            renderWidth = ch * imgRatio
            offsetX = (cw - renderWidth) / 2
          }
          mainCtx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight)
          mainCtx.restore()
        }
      }

      // The photo itself is never tilted or shifted: the frames already carry the head turn.
      const normalizedX = current.x // [-1, 1]
      const normalizedY = current.y

      // Depth Parallax on background halo
      if (haloEl) {
        const haloX = (-normalizedX * 12).toFixed(2)
        const haloY = (-normalizedY * 8).toFixed(2)
        haloEl.style.transform = `translate3d(${haloX}px, ${haloY}px, 0) scale(${1 + Math.hypot(normalizedX, normalizedY) * 0.04})`
      }

      // Background cyber embers
      if (ctx) {
        ctx.clearRect(0, 0, w, h)
        ctx.globalCompositeOperation = 'lighter'
        for (const p of ps) {
          p.life += 1
          if (p.life > p.max) Object.assign(p, spawn())
          p.x += p.vx + Math.sin((p.life + p.x) * 0.02) * 0.12
          p.y += p.vy
          const alpha = Math.sin(Math.PI * (p.life / p.max)) * 0.65
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4.5)
          gr.addColorStop(0, `rgba(180,255,150,${alpha})`)
          gr.addColorStop(1, 'rgba(140,255,97,0)')
          ctx.fillStyle = gr
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.r * 4.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className={`mx${isLoaded ? ' mx-loaded' : ''}`} ref={root}>
      <div className="mx-halo" ref={haloRef} aria-hidden="true" />
      <canvas className="mx-embers" ref={embersRef} aria-hidden="true" />
      <div className="mx-body" ref={bodyRef}>
        <div className="mx-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="mx-img"
            src="/mascot.webp"
            alt="ELYSIA, the AI agent mascot"
            width={NATIVE_WIDTH}
            height={NATIVE_HEIGHT}
          />
          <canvas
            className="mx-canvas"
            ref={canvasRef}
            width={NATIVE_WIDTH}
            height={NATIVE_HEIGHT}
            aria-hidden="true"
          />
          <i className="mx-sweep" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}
