'use client'

import { useEffect, useRef } from 'react'

const DENSITY = " .`'^\",:;Il!i~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"

export default function AsciiArt() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const mouseRef = useRef({ x: -9999, y: -9999 })
    const prevMouseRef = useRef({ x: -9999, y: -9999 })

    useEffect(() => {
        const canvas = canvasRef.current
        const video = videoRef.current
        if (!canvas || !video) return
        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) return
        const cvs = canvas
        const context = ctx

        const COLS = 120
        const ROWS = 68
        const FONT_SIZE = 11

        cvs.width = Math.round(COLS * FONT_SIZE * 0.62)
        cvs.height = Math.round(ROWS * FONT_SIZE * 1.05)

        const CW = cvs.width / COLS
        const CH = cvs.height / ROWS

        context.font = `${FONT_SIZE}px monospace`
        context.textAlign = 'center'
        context.textBaseline = 'middle'

        const offCanvas = document.createElement('canvas')
        offCanvas.width = COLS
        offCanvas.height = ROWS
        const offCtxRaw = offCanvas.getContext('2d', { willReadFrequently: true })
        if (!offCtxRaw) return
        const offCtx = offCtxRaw

        const disp = new Float32Array(COLS * ROWS)

        let raf: number

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvasRef.current?.getBoundingClientRect()
            if (!rect) return
            prevMouseRef.current = { ...mouseRef.current }
            mouseRef.current = {
                x: (e.clientX - rect.left) * (COLS / rect.width),
                y: (e.clientY - rect.top) * (ROWS / rect.height),
            }
        }

        const handleMouseLeave = () => {
            prevMouseRef.current = { x: -9999, y: -9999 }
            mouseRef.current = { x: -9999, y: -9999 }
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseleave', handleMouseLeave)

        function updateDisplacement() {
            const mx = mouseRef.current.x
            const my = mouseRef.current.y
            const px = prevMouseRef.current.x
            const py = prevMouseRef.current.y

            let speed = 0
            let hasMoved = false
            if (px > -999 && mx > -999) {
                const dvx = mx - px
                const dvy = my - py
                speed = Math.sqrt(dvx * dvx + dvy * dvy)
                hasMoved = speed > 0.05
            }

            for (let i = 0; i < COLS * ROWS; i++) {
                disp[i] *= 0.965
            }

            if (!hasMoved || mx < 0) {
                prevMouseRef.current = { ...mouseRef.current }
                return
            }

            const RADIUS = Math.min(6 + speed * 1.0, 15)
            const INJECT = Math.min(0.45 + speed * 0.12, 1.0)

            const c0 = Math.max(0, Math.floor(mx - RADIUS))
            const c1 = Math.min(COLS - 1, Math.ceil(mx + RADIUS))
            const r0 = Math.max(0, Math.floor(my - RADIUS))
            const r1 = Math.min(ROWS - 1, Math.ceil(my + RADIUS))

            for (let row = r0; row <= r1; row++) {
                for (let col = c0; col <= c1; col++) {
                    const dx = col - mx
                    const dy = row - my
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist > RADIUS) continue
                    const falloff = (1 - dist / RADIUS) ** 2
                    const idx = row * COLS + col
                    disp[idx] = Math.min(disp[idx] + INJECT * falloff, 1.0)
                }
            }

            prevMouseRef.current = { ...mouseRef.current }
        }

        function draw() {
            context.clearRect(0, 0, cvs.width, cvs.height)

            updateDisplacement()

            let pixels: Uint8ClampedArray | null = null
            const vid = videoRef.current
            if (vid && vid.readyState >= 2) {
                offCtx.drawImage(vid, 0, 0, COLS, ROWS)
                pixels = offCtx.getImageData(0, 0, COLS, ROWS).data
            }

            if (!pixels) {
                raf = requestAnimationFrame(draw)
                return
            }

            for (let row = 0; row < ROWS; row++) {
                for (let col = 0; col < COLS; col++) {
                    const idx = row * COLS + col
                    const d = disp[idx]
                    const visibility = 1 - d
                    if (visibility < 0.02) continue

                    const pixIdx = idx * 4
                    const r = pixels[pixIdx]
                    const g = pixels[pixIdx + 1]
                    const b = pixels[pixIdx + 2]

                    const luma = 0.299 * r + 0.587 * g + 0.114 * b

                    if (luma < 28) continue

                    const density = luma / 255
                    const charIdx = Math.floor(density * (DENSITY.length - 1))
                    const char = DENSITY[charIdx]

                    // 밝기에 따라 보라 → 핑크 그라데이션
                    const hue = 255 + density * 60    // ~255 violet → ~315 pink
                    const sat = 70 + density * 25
                    const lit = 35 + density * 62

                    context.globalAlpha = Math.min(1, density * 1.8 + 0.35) * visibility
                    context.fillStyle = `hsl(${hue}, ${Math.min(100, sat)}%, ${Math.min(92, lit)}%)`
                    context.fillText(char, col * CW + CW / 2, row * CH + CH / 2)
                }
            }

            context.globalAlpha = 1
            raf = requestAnimationFrame(draw)
        }

        video.addEventListener('canplay', () => { video.play().catch(() => {}) }, { once: true })
        if (video.readyState >= 3) { video.play().catch(() => {}) }

        draw()
        return () => {
            cancelAnimationFrame(raf)
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseleave', handleMouseLeave)
        }
    }, [])

    return (
        <div
            className="relative flex items-center justify-center w-full h-full"
            style={{ overflow: 'visible' }}
        >
            <video
                ref={videoRef}
                src="/Robot%20face%20animation.mp4"
                loop
                muted
                playsInline
                style={{ display: 'none' }}
            />
            <canvas
                ref={canvasRef}
                style={{
                    background: 'transparent',
                    position: 'relative',
                    zIndex: 10,
                    width: '130%',
                    height: '130%',
                    objectFit: 'cover',
                    top: 0,
                }}
            />
        </div>
    )
}
