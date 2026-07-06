import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Flame, Package, Eye, ArrowRight, TrendingUp, Trophy } from "lucide-react"
import { formatCurrency, formatTimeAgo, getCategoryLabel } from "@/lib/utils"

import { GrailScoreBadge } from "@/components/GrailScoreBadge"
import { calcGrailScore } from "@/lib/grailScore"

export const revalidate = 60 // Refresh every minute

async function getTrending() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)

  const grails = await prisma.grailRequest.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { id: true, name: true, image: true, verified: true } },
      offers: { where: { createdAt: { gte: sevenDaysAgo } }, select: { id: true } },
      _count: { select: { offers: true } },
    },
    orderBy: [{ views: "desc" }],
    take: 50,
  })

  return grails
    .map((g) => ({
      ...g,
      score: calcGrailScore({ category: g.category, budgetMax: g.budgetMax, offersCount: g._count.offers, views: g.views, createdAt: g.createdAt, verified: g.user.verified }),
      recentOffers: g.offers.length,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)
}

const CATEGORY_STATS = [
  { label: "NBA Cards",     category: "sports-cards-nba", emoji: "🏀", trend: "+12%" },
  { label: "Pokémon",       category: "pokemon",          emoji: "⚡", trend: "+8%" },
  { label: "MLB Cards",     category: "sports-cards-mlb", emoji: "⚾", trend: "+5%" },
  { label: "NFL Cards",     category: "sports-cards-nfl", emoji: "🏈", trend: "+3%" },
  { label: "Memorabilia",   category: "sports-memorabilia", emoji: "🏆", trend: "+15%" },
  { label: "Autographs",    category: "autographs",       emoji: "✍️", trend: "-2%" },
]

export default async function TrendingPage() {
  const trending = await getTrending()

  return (
    <div className="py-8 page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/15 flex items-center justify-center">
          <Flame className="w-6 h-6 text-orange-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Trending This Week</h1>
          <p className="text-neutral-500 text-sm">Most active grail requests ranked by GrailScore™</p>
        </div>
      </div>

      {/* Category heat map */}
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-5 mb-8">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2 text-sm">
          <TrendingUp className="w-4 h-4 text-orange-500" /> Category Trends (30 days)
        </h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {CATEGORY_STATS.map((c) => {
            const isUp = c.trend.startsWith("+")
            return (
              <Link
                key={c.category}
                href={`/grails?category=${c.category}`}
                className="flex flex-col items-center p-3 rounded-xl bg-neutral-800 hover:bg-orange-500/10 hover:border-orange-500/20 border border-transparent transition-all text-center"
              >
                <span className="text-2xl mb-1">{c.emoji}</span>
                <span className="text-xs font-medium text-neutral-300">{c.label}</span>
                <span className={`text-xs font-bold mt-1 ${isUp ? "text-green-600" : "text-red-500"}`}>{c.trend}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Trending list */}
      {trending.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <p className="text-neutral-500">No trending grails yet — check back soon!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {trending.map((grail, i) => {
            const images = JSON.parse(grail.images) as string[]
            return (
              <Link
                key={grail.id}
                href={`/grails/${grail.id}`}
                className="flex items-center gap-4 bg-neutral-900 rounded-xl border border-neutral-800 p-4 hover:shadow-md hover:border-orange-500/20 transition-all group"
              >
                {/* Rank */}
                <div className={`w-8 text-center font-bold flex-shrink-0 ${
                  i === 0 ? "text-orange-500 text-xl" : i < 3 ? "text-neutral-500 text-lg" : "text-neutral-500"
                }`}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </div>

                {/* Image */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-800 flex-shrink-0">
                  {images[0]
                    ? <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    : <div className="flex items-center justify-center h-full"><Trophy className="w-5 h-5 text-neutral-700" /></div>}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate text-sm">{grail.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800">{getCategoryLabel(grail.category)}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{grail.views}</span>
                    <span className="flex items-center gap-1"><Package className="w-3 h-3" />{grail._count.offers} offers</span>
                    {grail.recentOffers > 0 && (
                      <span className="text-orange-400 font-semibold">🔥 {grail.recentOffers} this week</span>
                    )}
                  </div>
                </div>

                {/* GrailScore + budget */}
                <div className="flex-shrink-0 flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-orange-500">{formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}</div>
                    <div className="text-xs text-neutral-500">{formatTimeAgo(grail.createdAt)}</div>
                  </div>
                  <GrailScoreBadge score={grail.score} size="md" showLabel />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      <div className="text-center mt-8">
        <Link href="/grails" className="inline-flex items-center gap-2 text-sm font-medium text-orange-500 hover:text-orange-400">
          Browse all grails <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
