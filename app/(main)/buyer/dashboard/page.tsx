import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Plus, Trophy, Clock, CheckCircle, TrendingUp, ArrowRight,
  Package, MessageSquare, Bookmark, BarChart3, FileText, Star,
} from "lucide-react"
import { formatCurrency, formatTimeAgo, getCategoryLabel } from "@/lib/utils"
import { GrailScoreBadge } from "@/components/GrailScoreBadge"
import { calcGrailScore } from "@/lib/grailScore"

export default async function BuyerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const [grails, recentOffers, totalSpent, unreadMessages, savedCount] = await Promise.all([
    prisma.grailRequest.findMany({
      where: { userId: session.user.id },
      include: {
        offers: { where: { status: { not: "WITHDRAWN" } }, select: { id: true, status: true, price: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.offer.findMany({
      where: { grailRequest: { userId: session.user.id }, status: { in: ["PENDING", "ACCEPTED"] } },
      include: {
        seller: { select: { id: true, name: true, image: true, verifiedSeller: true } },
        grailRequest: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.transaction.aggregate({
      where: { offer: { grailRequest: { userId: session.user.id } }, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.message.count({
      where: { conversation: { offer: { grailRequest: { userId: session.user.id } } }, read: false, senderId: { not: session.user.id } },
    }),
    prisma.savedOffer.count({ where: { userId: session.user.id } }),
  ])

  const activeGrails  = grails.filter((g) => g.status === "ACTIVE").length
  const completedGrails = grails.filter((g) => g.status === "COMPLETED").length
  const pendingOffers = recentOffers.filter((o) => o.status === "PENDING").length

  const STATS = [
    { label: "Active Requests", value: activeGrails, icon: Clock,      color: "text-blue-600 bg-blue-50",   href: "/buyer/requests" },
    { label: "New Offers",      value: pendingOffers, icon: Package,    color: "text-yellow-600 bg-yellow-50", href: "/buyer/requests" },
    { label: "Completed",       value: completedGrails, icon: CheckCircle, color: "text-green-600 bg-green-50", href: "/transactions" },
    { label: "Total Spent",     value: formatCurrency(totalSpent._sum.amount || 0), icon: TrendingUp, color: "text-purple-600 bg-purple-50", href: "/transactions" },
  ]

  const QUICK_LINKS = [
    { href: "/buyer/create",   icon: Plus,          label: "Post New Grail",   badge: null },
    { href: "/messages",       icon: MessageSquare, label: "Messages",          badge: unreadMessages > 0 ? unreadMessages : null },
    { href: "/buyer/saved",    icon: Bookmark,      label: "Saved Watchlist",   badge: savedCount > 0 ? savedCount : null },
    { href: "/transactions",   icon: BarChart3,     label: "Transaction History", badge: null },
    { href: "/buyer/requests", icon: FileText,      label: "All My Requests",   badge: null },
    { href: "/verify",         icon: Star,          label: "Get Verified",      badge: null },
  ]

  return (
    <div className="py-8 page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {session.user.name?.split(" ")[0] || "Collector"} 👋</h1>
          <p className="text-slate-500 text-sm mt-1">Here&apos;s what&apos;s happening with your grails</p>
        </div>
        <Link href="/buyer/create" className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" /> New Grail Request
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map((s) => (
          <Link key={s.label} href={s.href} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm hover:border-slate-300 transition-all">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Grail requests */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">My Grail Requests</h2>
            <Link href="/buyer/requests" className="text-sm text-yellow-600 hover:text-yellow-700 flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {grails.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-slate-200 p-10 text-center">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-medium text-slate-600 mb-1">No grail requests yet</h3>
              <p className="text-sm text-slate-400 mb-4">Post your first request and let sellers find you</p>
              <Link href="/buyer/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
                <Plus className="w-4 h-4" /> Post a Grail
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {grails.map((grail) => {
                const images = JSON.parse(grail.images) as string[]
                const pending = grail.offers.filter((o) => o.status === "PENDING").length
                const score = calcGrailScore({ category: grail.category, budgetMax: grail.budgetMax, offersCount: grail._count.offers, views: grail.views, createdAt: grail.createdAt })
                return (
                  <Link key={grail.id} href={`/grails/${grail.id}`} className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition-all group">
                    <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {images[0] ? <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Trophy className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate text-sm">{grail.title}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{getCategoryLabel(grail.category)} · {formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}</div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <GrailScoreBadge score={score} size="sm" animated={false} />
                      {pending > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">{pending} new</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${grail.status === "ACTIVE" ? "bg-green-100 text-green-800" : grail.status === "COMPLETED" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                          {grail.status.charAt(0) + grail.status.slice(1).toLowerCase()}
                        </span>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Recent Offers */}
          <div>
            <h2 className="font-semibold text-slate-900 mb-3 text-sm">Recent Offers</h2>
            {recentOffers.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-5 text-center">
                <Package className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No offers yet on your requests</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOffers.map((offer) => (
                  <Link key={offer.id} href={`/grails/${offer.grailRequestId}`} className="flex items-start gap-3 bg-white rounded-xl border border-slate-200 p-3 hover:shadow-sm transition-all">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0 mt-0.5">
                      {offer.seller.image ? <img src={offer.seller.image} alt="" className="w-full h-full object-cover" /> : offer.seller.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 truncate">{offer.grailRequest.title}</p>
                      <p className="text-sm font-semibold text-slate-900 mt-0.5">{formatCurrency(offer.price)}</p>
                      <p className="text-xs text-slate-400">{offer.seller.name} {offer.seller.verifiedSeller && "✓"}</p>
                    </div>
                    <span className={`flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full font-medium ${offer.status === "PENDING" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}>
                      {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-slate-200 hover:border-yellow-300 hover:bg-yellow-50 transition-all text-center">
                <l.icon className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-medium text-slate-700 leading-tight">{l.label}</span>
                {l.badge !== null && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{l.badge}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
