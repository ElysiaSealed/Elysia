'use client'
import { useEffect, useRef, useState } from 'react'

/**
 * Animated ELYSIA mascot stage.
 * - Powered by Sovra's 60FPS High-Performance Canvas Persona Engine:
 *   1. 1280x720 HD Continuous Video Frames (frame_0054 to frame_0124) -> 71 dense frames across head turn.
 *   2. Velocity Clamping (MAX_VELOCITY = 0.018) -> Smooth natural head-turn speed limit; prevents skipping poses on fast cursor flicks.
 *   3. Soft Natural Inertia (DAMPING_FACTOR = 0.045) -> Physical mass with liquid ease-in & ease-out.
 *   4. SmoothStep Input Easing -> Eliminates edge border snapping & stabilizes the center gaze.
 *   5. High-DPR Canvas Buffer & Aspect Cover Math -> 1:1 razor-sharp rendering on all displays.
 *   6. Sub-frame 3D Perspective Rotation -> rotateY / rotateX tilts to complement the video frames.
 *   7. Background Cyber Embers -> Glows in the rear aura without obstructing the face.
 */

const START_FRAME = 54
const END_FRAME = 124
const CENTER_FRAME = 89
const SWEEP_COUNT = END_FRAME - START_FRAME // 70 steps

// Sovra Physics Constants
const MAX_VELOCITY = 0.018 // Maximum frame step per tick (60FPS) to prevent whipping
const DAMPING_FACTOR = 0.045 // Soft natural inertia

const NATIVE_WIDTH = 1280
const NATIVE_HEIGHT = 720

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

    // 1. Preload video frames into memory
    const images: Map<number, HTMLImageElement> = new Map()
    let loadedCount = 0

    const onLoadFrame = (frameNum: number) => {
      loadedCount++
      if (frameNum === CENTER_FRAME || loadedCount >= 8) {
        setIsLoaded(true)
      }
    }

    // Priority 1: Center frame and primary anchors
    const priority = [CENTER_FRAME, START_FRAME, END_FRAME, 70, 105, 60, 115]
    for (const fNum of priority) {
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => onLoadFrame(fNum)
      img.src = `/mascot/frame_${String(fNum).padStart(4, '0')}.webp`
      images.set(fNum, img)
    }

    // Priority 2: Preload remaining frames
    for (let fNum = START_FRAME; fNum <= END_FRAME; fNum++) {
      if (images.has(fNum)) continue
      const img = new Image()
      img.decoding = 'async'
      img.onload = () => onLoadFrame(fNum)
      img.src = `/mascot/frame_${String(fNum).padStart(4, '0')}.webp`
      images.set(fNum, img)
    }

    // Pointer Tracking with Sovra's S-curve smoothing
    const targetProgressRef = { current: 0.5 } // 0.5 is center facing
    const currentProgressRef = { current: 0.5 }
    const currentYRef = { current: 0 }
    let lastMoveTime = performance.now()

    const smoothStep = (min: number, max: number, value: number) => {
      const x = Math.max(0, Math.min(1, (value - min) / (max - min)))
      return x * x * (3 - 2 * x)
    }

    const onMove = (e: PointerEvent) => {
      const { innerWidth, innerHeight } = window
      if (innerWidth <= 0 || innerHeight <= 0) return

      // Normalized coordinates [0, 1]
      const rawX = e.clientX / innerWidth
      const rawY = e.clientY / innerHeight

      // Sovra S-curve: softens movement at borders, stabilizes center
      const smoothedX = smoothStep(0.05, 0.95, rawX)

      // Subtle Y influence adds micro nuance
      const yInfluence = (rawY - 0.5) * 0.08
      const combinedTarget = Math.min(Math.max(smoothedX + yInfluence, 0), 1)

      targetProgressRef.current = combinedTarget
      currentYRef.current = (rawY - 0.5) * 2 // [-1, 1]
      lastMoveTime = performance.now()
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const onMouseLeave = () => {
      // Gently return gaze to center when cursor leaves window
      targetProgressRef.current = 0.5
      currentYRef.current = 0
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

    const tick = (now: number) => {
      const t = (now - start) / 1000

      // Auto-idle: gently return to calm breathing center after 3.5s
      const isIdle = now - lastMoveTime > 3500
      let activeTargetProgress: number

      if (isIdle) {
        // Natural organic breathing micro-sway around center (0.5)
        activeTargetProgress = 0.5 + Math.sin(t * 0.45) * 0.08
      } else {
        activeTargetProgress = targetProgressRef.current
      }

      // Sovra Physics: Calculate distance to target with velocity clamping
      const diff = activeTargetProgress - currentProgressRef.current
      const desiredStep = diff * DAMPING_FACTOR
      const clampedStep = Math.min(Math.max(desiredStep, -MAX_VELOCITY), MAX_VELOCITY)
      currentProgressRef.current += clampedStep

      // Map progress [0, 1] to continuous video frames [54, 124]
      // 0.0 (Left) -> Frame 54 (Looking Left)
      // 0.5 (Center) -> Frame 89 (Looking Center)
      // 1.0 (Right) -> Frame 124 (Looking Right)
      const frameIndex = Math.min(
        Math.max(Math.round(START_FRAME + currentProgressRef.current * SWEEP_COUNT), START_FRAME),
        END_FRAME
      )

      // High-DPI Canvas Rendering with Sovra Aspect Ratio Cover Calculations
      if (mainCtx) {
        const cr = canvas.getBoundingClientRect()
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const cw = cr.width
        const ch = cr.height

        if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) {
          canvas.width = Math.round(cw * dpr)
          canvas.height = Math.round(ch * dpr)
        }

        const currentImg = images.get(frameIndex) || images.get(CENTER_FRAME)

        if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
          mainCtx.save()
          mainCtx.scale(dpr, dpr)
          mainCtx.clearRect(0, 0, cw, ch)

          // Aspect cover calculations with bias toward face center
          const imgWidth = currentImg.naturalWidth
          const imgHeight = currentImg.naturalHeight
          const imgRatio = imgWidth / imgHeight
          const canvasRatio = cw / ch

          let renderWidth = cw
          let renderHeight = ch
          let offsetX = 0
          let offsetY = 0

          if (canvasRatio > imgRatio) {
            renderWidth = cw
            renderHeight = cw / imgRatio
            offsetY = (ch - renderHeight) * 0.18 // bias toward face center
          } else {
            renderHeight = ch
            renderWidth = ch * imgRatio
            offsetX = (cw - renderWidth) / 2
          }

          mainCtx.drawImage(currentImg, offsetX, offsetY, renderWidth, renderHeight)
          mainCtx.restore()
        }
      }

      // Continuous 3D Perspective Rotation & Parallax
      const normalizedX = (currentProgressRef.current - 0.5) * 2 // [-1, 1]
      const normalizedY = currentYRef.current

      const rotY = (normalizedX * 4.2).toFixed(2)
      const rotX = (-normalizedY * 3.4).toFixed(2)
      const rotZ = (normalizedX * normalizedY * 1.2).toFixed(2)
      const shiftX = (normalizedX * 18).toFixed(2)
      const shiftY = (normalizedY * 12).toFixed(2)

      bodyEl.style.transform = `perspective(1000px) translate3d(${shiftX}px, ${shiftY}px, 0) rotateY(${rotY}deg) rotateX(${rotX}deg) rotateZ(${rotZ}deg)`

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
