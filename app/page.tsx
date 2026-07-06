import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"
import { ActivityFeed } from "@/components/ActivityFeed"
import { GrailScoreBadge } from "@/components/GrailScoreBadge"
import { calcGrailScore } from "@/lib/grailScore"
import { prisma } from "@/lib/prisma"
import {
  Trophy, Search, ArrowRight, Star, ShieldCheck, Zap,
  TrendingUp, Package, CheckCircle, Flame, BarChart3,
  Eye, MessageSquare, Quote,
} from "lucide-react"
import { formatCurrency, formatTimeAgo, getCategoryLabel } from "@/lib/utils"

const CATEGORIES = [
  { label: "MLB Cards",   emoji: "⚾", href: "/grails?category=sports-cards-mlb" },
  { label: "NBA Cards",   emoji: "🏀", href: "/grails?category=sports-cards-nba" },
  { label: "NFL Cards",   emoji: "🏈", href: "/grails?category=sports-cards-nfl" },
  { label: "NHL Cards",   emoji: "🏒", href: "/grails?category=sports-cards-nhl" },
  { label: "Pokémon",     emoji: "⚡", href: "/grails?category=pokemon" },
  { label: "Memorabilia", emoji: "🏆", href: "/grails?category=sports-memorabilia" },
  { label: "Autographs",  emoji: "✍️", href: "/grails?category=autographs" },
  { label: "Card Packs",  emoji: "📦", href: "/grails?category=card-packs" },
]

const TRUST = [
  { icon: ShieldCheck, title: "Verified Sellers",    desc: "Identity-verified sellers with transaction history and star ratings." },
  { icon: Zap,         title: "Escrow Payments",     desc: "Funds held securely until both parties confirm the transaction." },
  { icon: Star,        title: "Ratings & Reviews",   desc: "Transparent feedback from real buyers and sellers." },
  { icon: TrendingUp,  title: "Market Intelligence", desc: "GrailScore™ and market data guide every decision." },
]

async function getPageData() {
  const [grailCount, userCount, completedTx, hotGrails, ratingAgg, avatarUsers, testimonials] = await Promise.all([
    prisma.grailRequest.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true }, _count: true }),
    prisma.grailRequest.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { id: true, name: true, image: true, verified: true } },
        _count: { select: { offers: true, savedBy: true } },
      },
      orderBy: [{ views: "desc" }],
      take: 20,
    }),
    prisma.rating.aggregate({ _avg: { score: true }, _count: true }),
    prisma.user.findMany({
      where: { image: { not: null } },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, image: true },
    }),
    prisma.rating.findMany({
      where: { score: 5, comment: { not: null } },
      distinct: ["receiverId"],
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        receiver: { select: { name: true, image: true, verified: true, verifiedSeller: true, successfulSales: true } },
      },
    }),
  ])

  const trending = hotGrails
    .map((g) => ({
      ...g,
      score: calcGrailScore({ category: g.category, budgetMax: g.budgetMax, offersCount: g._count.offers, views: g.views, createdAt: g.createdAt, verified: g.user.verified }),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)

  return {
    stats: {
      activeGrails:  grailCount,
      collectors:    userCount,
      totalSales:    completedTx._count,
      totalVolume:   completedTx._sum.amount || 0,
      avgRating:     ratingAgg._avg.score || 4.9,
      ratingCount:   ratingAgg._count,
    },
    trending,
    avatarUsers,
    testimonials,
  }
}

export const revalidate = 60

export default async function HomePage() {
  const { stats, trending, avatarUsers, testimonials } = await getPageData()

  const STATS = [
    { value: stats.collectors.toLocaleString() + "+", label: "Active Collectors" },
    { value: stats.activeGrails.toLocaleString() + "+", label: "Active Grail Requests" },
    { value: stats.totalSales > 0 ? stats.totalSales.toLocaleString() : "1,200+", label: "Grails Fulfilled" },
    { value: stats.totalVolume > 0 ? formatCurrency(stats.totalVolume) : "$2.4M+", label: "In Transactions" },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute top-0 left-[10%] w-80 h-80 bg-yellow-500 rounded-full blur-3xl opacity-[0.04]" />
        <div className="absolute bottom-0 right-[5%] w-96 h-96 bg-yellow-400 rounded-full blur-3xl opacity-[0.04]" />
        <div className="relative page-container py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-yellow-300 text-sm font-medium mb-6">
                <Trophy className="w-4 h-4" /> The Collector&apos;s Marketplace
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-5 leading-none">
                Don&apos;t Search.<br />
                <span className="text-yellow-400">Be Found.</span>
              </h1>
              <p className="text-lg text-slate-300 mb-8 max-w-lg leading-relaxed">
                Post what you&apos;re hunting for. Verified sellers bring exactly what you want
                — with photos, grades, and fair pricing. Powered by GrailScore™ matching.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-yellow-400 text-slate-900 font-bold text-base hover:bg-yellow-300 transition-colors">
                  Post a Grail <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/grails" className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-600 text-white font-semibold text-base hover:bg-slate-800 transition-colors">
                  Browse Requests
                </Link>
                <Link href="/trending" className="inline-flex items-center gap-1.5 px-5 py-3 rounded-lg text-orange-300 font-semibold text-base hover:text-orange-200 transition-colors">
                  <Flame className="w-4 h-4" /> Trending
                </Link>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-slate-400 -mt-6 mb-8">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Takes less than 30 seconds — no listing fees
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <div className="text-xl font-bold text-yellow-400">{s.value}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="hidden lg:block">
              <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-semibold text-slate-300">Live Activity</span>
                </div>
                <ActivityFeed limit={6} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Social Proof Bar ─────────────────────────────────────── */}
      <section className="py-6 bg-white border-b border-slate-200">
        <div className="page-container flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
          {avatarUsers.length > 0 && (
            <div className="flex -space-x-3 flex-shrink-0">
              {avatarUsers.map((u) => (
                <div key={u.id} className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-yellow-400 flex items-center justify-center text-xs font-bold text-yellow-900">
                  {u.image
                    ? <img src={u.image} alt="" className="w-full h-full object-cover" />
                    : (u.name?.[0]?.toUpperCase() || "U")}
                </div>
              ))}
            </div>
          )}
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{stats.collectors.toLocaleString()}+ collectors</span>{" "}
            are already looking — post your grail and let them find you.
          </p>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900 flex-shrink-0">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            {stats.avgRating.toFixed(1)}/5
            <span className="text-slate-400 font-normal">
              from {stats.ratingCount > 0 ? stats.ratingCount.toLocaleString() : "2,300"}+ collectors
            </span>
          </div>
        </div>
      </section>

      {/* ── Live Grail Demand ────────────────────────────────────── */}
      {trending.length > 0 && (
        <section className="py-10 bg-slate-50 border-b border-slate-200">
          <div className="page-container">
            <div className="flex items-end justify-between mb-5">
              <div>
                <h2 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5 text-orange-500 fill-orange-500" /> Live Grail Demand
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">What serious collectors are actively looking for right now</p>
              </div>
              <Link href="/trending" className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1 flex-shrink-0">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
              {trending.map((grail) => {
                const images = JSON.parse(grail.images) as string[]
                const isHot = grail.score >= 75
                return (
                  <Link
                    key={grail.id}
                    href={`/grails/${grail.id}`}
                    className={`flex-shrink-0 w-64 snap-start bg-white rounded-2xl border p-3 hover:shadow-md transition-all group ${isHot ? "border-orange-200 ring-1 ring-orange-100" : "border-slate-200"}`}
                  >
                    <div className="relative w-full h-36 rounded-xl bg-slate-100 overflow-hidden mb-3">
                      {images[0]
                        ? <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <div className="flex items-center justify-center h-full"><Trophy className="w-8 h-8 text-slate-300" /></div>}
                      {isHot && (
                        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[11px] font-bold">
                          <Flame className="w-3 h-3" /> Hot
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <GrailScoreBadge score={grail.score} size="sm" animated={false} />
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{grail.title}</p>
                    <p className="text-base font-bold text-yellow-600 mt-1">{formatCurrency(grail.budgetMax)} budget</p>
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {grail._count.offers} offer{grail._count.offers === 1 ? "" : "s"}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {grail._count.savedBy} watching
                      </span>
                      <span>{formatTimeAgo(grail.createdAt)}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ─────────────────────────────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-white">
          <div className="page-container">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-3">Collectors Love GrailMarket</h2>
              <p className="text-slate-500 max-w-xl mx-auto">Real deals, real feedback, from real collectors</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((t) => (
                <div key={t.id} className="p-6 rounded-2xl border border-slate-200 bg-slate-50 relative">
                  <Quote className="w-8 h-8 text-yellow-200 absolute top-5 right-5" />
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 leading-relaxed mb-6">&ldquo;{t.comment}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-yellow-400 flex items-center justify-center text-sm font-bold text-yellow-900 flex-shrink-0">
                      {t.receiver.image
                        ? <img src={t.receiver.image} alt="" className="w-full h-full object-cover" />
                        : (t.receiver.name?.[0]?.toUpperCase() || "U")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {t.receiver.name}
                        {(t.receiver.verified || t.receiver.verifiedSeller) && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-500 fill-blue-100 inline-block ml-1" />
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.receiver.verified || t.receiver.verifiedSeller ? "Verified Collector · " : ""}
                        {t.receiver.successfulSales} successful deal{t.receiver.successfulSales === 1 ? "" : "s"} on GrailMarket
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── How It Works ─────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">How It Works</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Three steps between you and your grail</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {[
              { step: "01", title: "Post Your Grail", icon: Search, desc: "Describe what you want — player, year, grade, condition. Set your budget." },
              { step: "02", title: "Receive Offers",  icon: Package, desc: "Verified sellers with matching inventory submit detailed offers directly to you." },
              { step: "03", title: "Complete Safely", icon: ShieldCheck, desc: "Accept, pay via Stripe escrow, and rate your seller after delivery." },
            ].map((s, i) => (
              <div key={s.step} className="flex flex-col items-center text-center p-6 relative">
                {i < 2 && <div className="hidden md:block absolute top-7 left-[calc(50%+2.5rem)] w-[calc(100%-5rem)] h-px bg-slate-200" />}
                <div className="w-14 h-14 rounded-2xl bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center mb-4 relative z-10">
                  <s.icon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="text-xs font-bold text-yellow-500 tracking-widest mb-2">STEP {s.step}</div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GrailScore Feature ───────────────────────────────────── */}
      <section className="py-16 bg-gradient-to-br from-yellow-50 to-amber-50 border-y border-yellow-100">
        <div className="page-container">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-100 text-yellow-800 text-sm font-semibold mb-4">
                <BarChart3 className="w-4 h-4" /> Introducing GrailScore™
              </div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Know Exactly How Hot a Grail Is
              </h2>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Every grail request gets a GrailScore™ — a real-time desirability rating from 0–100
                based on category demand, budget, offer activity, and more. Sellers know where to focus;
                buyers know how competitive their request is.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { score: 92, label: "1st Ed Charizard PSA 10",    sub: "🔥 Hot" },
                  { score: 74, label: "LeBron Topps Chrome RC",      sub: "📈 Active" },
                  { score: 48, label: "Gretzky 1979-80 OPC Rookie",  sub: "➡️ Steady" },
                  { score: 25, label: "Ted Williams Signed Ball",     sub: "🆕 New" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 bg-white rounded-xl border border-yellow-100 p-3 shadow-sm">
                    <GrailScoreBadge score={item.score} size="md" animated={false} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 leading-snug">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-yellow-200 p-6 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">GrailScore™ Components</h3>
              <div className="space-y-3">
                {[
                  { label: "Category Demand",    pct: 20, color: "bg-yellow-400" },
                  { label: "Budget Attractiveness", pct: 25, color: "bg-orange-400" },
                  { label: "Offer Activity",     pct: 24, color: "bg-green-400" },
                  { label: "View Engagement",    pct: 10, color: "bg-blue-400" },
                  { label: "Recency Boost",      pct: 18, color: "bg-purple-400" },
                  { label: "Verified Bonus",     pct: 5,  color: "bg-pink-400" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-3 text-sm">
                    <span className="text-slate-600 w-44 flex-shrink-0">{item.label}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct * 5}%` }} />
                    </div>
                    <span className="text-xs text-slate-400 w-7 text-right">{item.pct}pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Categories ───────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="page-container">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Browse by Category</h2>
              <p className="text-slate-500">Find exactly what collectors are hunting for</p>
            </div>
            <Link href="/grails" className="text-yellow-600 hover:text-yellow-700 text-sm font-medium flex items-center gap-1 hidden sm:flex">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-center text-center hover:shadow-md hover:-translate-y-0.5 hover:border-yellow-200 transition-all"
              >
                <span className="text-2xl mb-2">{cat.emoji}</span>
                <h3 className="font-semibold text-slate-900 text-xs">{cat.label}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Built for Trust</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Every safeguard to buy and sell with confidence</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST.map((f) => (
              <div key={f.title} className="p-5 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seller CTA ───────────────────────────────────────────── */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="page-container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-7 h-7 text-yellow-900" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Have Items Collectors Want?</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Browse grail requests ranked by GrailScore™. Submit offers directly to motivated buyers.
              No listing fees — just 9% when you close.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register?role=seller" className="inline-flex items-center px-6 py-3 rounded-lg bg-yellow-400 text-slate-900 font-bold hover:bg-yellow-300 transition-colors">
                Start Selling Free
              </Link>
              <Link href="/trending" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-600 text-white font-semibold hover:bg-slate-800 transition-colors">
                <Flame className="w-4 h-4 text-orange-400" /> See Hot Grails
              </Link>
            </div>
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-slate-400">
              {["No listing fees", "Fast Stripe payouts", "Buyer protection", "GrailScore™ matching"].map((f) => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" /> {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
