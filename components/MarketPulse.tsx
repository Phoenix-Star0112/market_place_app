"use client"

import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react"
import { formatCurrency } from "@/lib/utils"

export interface MarketData {
  category: string
  avgPrice: number
  priceChange: number   // % change vs last month
  activeGrails: number
  completedThisMonth: number
  hotness: "🔥" | "📈" | "➡️" | "📉"
}

interface Props {
  data: MarketData
  compact?: boolean
}

export function MarketPulse({ data, compact = false }: Props) {
  const { priceChange } = data
  const TrendIcon = priceChange > 3 ? TrendingUp : priceChange < -3 ? TrendingDown : Minus
  const trendColor = priceChange > 3 ? "text-green-600" : priceChange < -3 ? "text-red-500" : "text-slate-500"
  const trendBg = priceChange > 3 ? "bg-green-50" : priceChange < -3 ? "bg-red-50" : "bg-slate-50"

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100">
        <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs text-slate-600">
          Market avg: <strong className="text-slate-900">{formatCurrency(data.avgPrice)}</strong>
        </span>
        <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          {priceChange > 0 ? "+" : ""}{priceChange.toFixed(1)}%
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-yellow-500" /> Market Pulse
        </h3>
        <span className="text-lg">{data.hotness}</span>
      </div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <dt className="text-slate-500">Avg market price</dt>
          <dd className="font-semibold text-slate-900">{formatCurrency(data.avgPrice)}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-slate-500">Price trend (30d)</dt>
          <dd className={`flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-xs ${trendColor} ${trendBg}`}>
            <TrendIcon className="w-3 h-3" />
            {priceChange > 0 ? "+" : ""}{priceChange.toFixed(1)}%
          </dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-slate-500">Active grails</dt>
          <dd className="font-semibold text-slate-900">{data.activeGrails}</dd>
        </div>
        <div className="flex justify-between items-center">
          <dt className="text-slate-500">Sold this month</dt>
          <dd className="font-semibold text-slate-900">{data.completedThisMonth}</dd>
        </div>
      </dl>

      {/* Simple sparkline (pure CSS bars) */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-2">6-month price trend</p>
        <div className="flex items-end gap-1 h-10">
          {generateSparkline(data.avgPrice, data.priceChange).map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all ${i === 5 ? "bg-yellow-400" : "bg-slate-200"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function generateSparkline(avgPrice: number, trend: number): number[] {
  const base = 50
  const slope = trend / 5
  return Array.from({ length: 6 }, (_, i) => {
    const noise = (Math.sin(i * 2.3 + avgPrice % 7) * 12)
    return Math.max(15, Math.min(95, base + slope * (i - 2.5) + noise))
  })
}

/** Generate mock market data for a category based on actual grails */
export function buildMarketData(
  category: string,
  grails: Array<{ budgetMin: number; budgetMax: number; status: string }>
): MarketData {
  const active = grails.filter((g) => g.status === "ACTIVE")
  const completed = grails.filter((g) => g.status === "COMPLETED")
  const avgPrice = active.length
    ? active.reduce((s, g) => s + (g.budgetMin + g.budgetMax) / 2, 0) / active.length
    : 500

  // Deterministic "trend" from category name hash
  const hash = category.split("").reduce((s, c) => s + c.charCodeAt(0), 0)
  const priceChange = ((hash % 30) - 10) / 2   // range -5 to +10

  const hotness: MarketData["hotness"] =
    active.length > 10 ? "🔥" : priceChange > 3 ? "📈" : priceChange < -2 ? "📉" : "➡️"

  return { category, avgPrice, priceChange, activeGrails: active.length, completedThisMonth: completed.length, hotness }
}
