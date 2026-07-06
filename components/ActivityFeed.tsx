"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Trophy, Package, CheckCircle, Star, Clock } from "lucide-react"
import { formatTimeAgo, formatCurrency, getCategoryLabel } from "@/lib/utils"

interface Activity {
  id: string
  type: "new_grail" | "new_offer" | "offer_accepted" | "completed" | "new_rating"
  title: string
  subtitle: string
  link?: string
  time: string
  meta?: string
}

const ICONS = {
  new_grail:      { icon: Trophy,       color: "bg-yellow-100 text-yellow-700" },
  new_offer:      { icon: Package,      color: "bg-blue-100 text-blue-700" },
  offer_accepted: { icon: CheckCircle,  color: "bg-green-100 text-green-700" },
  completed:      { icon: CheckCircle,  color: "bg-purple-100 text-purple-700" },
  new_rating:     { icon: Star,         color: "bg-amber-100 text-amber-700" },
}

export function ActivityFeed({ limit = 8 }: { limit?: number }) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/activity?limit=${limit}`)
      .then((r) => r.json())
      .then((d) => { setActivities(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [limit])

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex-shrink-0" />
            <div className="flex-1">
              <div className="h-3 bg-slate-100 rounded w-3/4 mb-1.5" />
              <div className="h-2.5 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!activities.length) return (
    <div className="text-center py-6 text-sm text-slate-400">
      <Clock className="w-6 h-6 mx-auto mb-2 opacity-40" />
      No recent activity yet
    </div>
  )

  return (
    <div className="space-y-3">
      {activities.map((a) => {
        const { icon: Icon, color } = ICONS[a.type] ?? ICONS.new_grail
        return (
          <div key={a.id} className="flex items-start gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              {a.link ? (
                <Link href={a.link} className="text-sm font-medium text-slate-900 hover:text-yellow-600 line-clamp-1">
                  {a.title}
                </Link>
              ) : (
                <p className="text-sm font-medium text-slate-900 line-clamp-1">{a.title}</p>
              )}
              <p className="text-xs text-slate-500 mt-0.5">{a.subtitle}</p>
            </div>
            <div className="flex-shrink-0 text-right">
              {a.meta && <div className="text-xs font-semibold text-yellow-600">{a.meta}</div>}
              <div className="text-[11px] text-slate-400">{formatTimeAgo(a.time)}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
