"use client"

import { formatCurrency } from "@/lib/utils"

interface DataPoint { label: string; value: number }

interface Props {
  data: DataPoint[]
  title?: string
  color?: string
}

export function RevenueChart({ data, title = "Revenue", color = "#eab308" }: Props) {
  if (!data.length) return null

  const max = Math.max(...data.map((d) => d.value), 1)
  const W = 100
  const H = 60
  const PAD_X = 0
  const PAD_Y = 8

  const points = data.map((d, i) => ({
    x: PAD_X + (i / Math.max(data.length - 1, 1)) * (W - PAD_X * 2),
    y: PAD_Y + (1 - d.value / max) * (H - PAD_Y * 2),
  }))

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ")
  const area = `${points[0].x},${H} ` + polyline + ` ${points[points.length - 1].x},${H}`

  return (
    <div>
      {title && <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{title}</p>}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 80 }}>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <polygon points={area} fill="url(#grad)" />
          <polyline points={polyline} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="1.8" fill={color} />
          ))}
        </svg>
        {/* X-axis labels */}
        <div className="flex justify-between mt-1">
          {data.map((d) => (
            <span key={d.label} className="text-[9px] text-slate-400">{d.label}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
