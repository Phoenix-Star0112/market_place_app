"use client"

import { useEffect, useState } from "react"

interface GrailScoreProps {
  score: number          // 0-100
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  animated?: boolean
}

const SIZE = { sm: 36, md: 48, lg: 64 }
const STROKE = { sm: 3, md: 3.5, lg: 4.5 }

function getColor(score: number) {
  if (score >= 75) return { stroke: "#22c55e", text: "text-green-600", label: "Hot", bg: "bg-green-50" }
  if (score >= 50) return { stroke: "#eab308", text: "text-yellow-600", label: "Active", bg: "bg-yellow-50" }
  if (score >= 25) return { stroke: "#f97316", text: "text-orange-500", label: "Warm", bg: "bg-orange-50" }
  return { stroke: "#94a3b8", text: "text-slate-500", label: "New", bg: "bg-slate-50" }
}

export function GrailScoreBadge({ score, size = "md", showLabel = false, animated = true }: GrailScoreProps) {
  const [displayed, setDisplayed] = useState(animated ? 0 : score)
  const dim = SIZE[size]
  const stroke = STROKE[size]
  const r = (dim - stroke * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (displayed / 100) * circ
  const { stroke: color, text, label, bg } = getColor(score)

  useEffect(() => {
    if (!animated) return
    let start: number | null = null
    const duration = 900
    const step = (ts: number) => {
      if (!start) start = ts
      const progress = Math.min((ts - start) / duration, 1)
      setDisplayed(Math.round(progress * score))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [score, animated])

  return (
    <div className={`inline-flex items-center gap-1.5 ${showLabel ? `rounded-full px-2 py-1 ${bg}` : ""}`}>
      <div className="relative flex-shrink-0" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
          <circle
            cx={dim / 2} cy={dim / 2} r={r} fill="none"
            stroke={color} strokeWidth={stroke}
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: animated ? "none" : "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center font-bold ${text} ${size === "sm" ? "text-[9px]" : size === "md" ? "text-[11px]" : "text-sm"}`}>
          {displayed}
        </span>
      </div>
      {showLabel && (
        <span className={`text-xs font-semibold ${text}`}>{label}</span>
      )}
    </div>
  )
}

// Re-export from lib so server components can import from there
export { calcGrailScore } from "@/lib/grailScore"
