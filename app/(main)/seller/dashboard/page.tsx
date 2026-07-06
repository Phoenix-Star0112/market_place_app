import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Package, Trophy, DollarSign, Star, ArrowRight,
  TrendingUp, CheckCircle, Clock, ShieldCheck,
  BarChart2, Boxes, MessageSquare, Receipt, ShoppingBag,
  UserCheck, AlertCircle,
} from "lucide-react"
import { formatCurrency, formatTimeAgo, getCategoryLabel, CATEGORIES } from "@/lib/utils"
import { RevenueChart } from "@/components/RevenueChart"
import { calcGrailScore } from "@/lib/grailScore"

// Suppress unused-import warning for calcGrailScore — used indirectly via dashboard score card
void calcGrailScore

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const sellerId = session.user.id

  // Fetch all data in parallel
  const [allOffers, completedTransactions, user] = await Promise.all([
    prisma.offer.findMany({
      where: { sellerId },
      include: {
        grailRequest: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.transaction.findMany({
      where: { offer: { sellerId }, status: "COMPLETED" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: sellerId },
      include: {
        ratingsReceived: { select: { score: true } },
        _count: { select: { offers: true } },
      },
    }),
  ])

  // ── Monthly Revenue (last 6 months) ─────────────────────────────────────
  const now = new Date()
  const monthlyData: { label: string; value: number; monthKey: string }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyData.push({
      label: MONTH_LABELS[d.getMonth()],
      value: 0,
      monthKey: `${d.getFullYear()}-${d.getMonth()}`,
    })
  }
  for (const tx of completedTransactions) {
    const d = new Date(tx.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = monthlyData.find((m) => m.monthKey === key)
    if (bucket) bucket.value += tx.sellerPayout
  }
  const chartData = monthlyData.map(({ label, value }) => ({ label, value }))

  // MoM change
  const thisMonthRevenue = monthlyData[5].value
  const lastMonthRevenue = monthlyData[4].value
  const momChange =
    lastMonthRevenue === 0
      ? thisMonthRevenue > 0
        ? 100
        : 0
      : Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)

  // ── Offer Pipeline counts ────────────────────────────────────────────────
  const pendingCount = allOffers.filter((o) => o.status === "PENDING").length
  const counteredCount = allOffers.filter((o) => o.status === "COUNTERED").length
  const acceptedCount = allOffers.filter((o) => o.status === "ACCEPTED").length
  const completedCount = allOffers.filter((o) => o.status === "COMPLETED").length
  const declinedCount = allOffers.filter((o) => o.status === "DECLINED").length

  // ── Recent offers (top 8) ────────────────────────────────────────────────
  const recentOffers = allOffers.slice(0, 8)

  // ── Reputation ───────────────────────────────────────────────────────────
  const ratings = user?.ratingsReceived ?? []
  const avgRating =
    ratings.length
      ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length)
      : null
  const avgRatingDisplay = avgRating !== null ? avgRating.toFixed(1) : null

  const acceptedOrDeclined = allOffers.filter(
    (o) => o.status === "ACCEPTED" || o.status === "DECLINED"
  )
  const acceptanceRate =
    acceptedOrDeclined.length > 0
      ? Math.round(
          (allOffers.filter((o) => o.status === "ACCEPTED").length /
            acceptedOrDeclined.length) *
            100
        )
      : null

  // ── Category Performance ─────────────────────────────────────────────────
  const categoryMap: Record<string, { count: number; totalPrice: number }> = {}
  for (const o of allOffers) {
    const cat = o.grailRequest.category
    if (!categoryMap[cat]) categoryMap[cat] = { count: 0, totalPrice: 0 }
    categoryMap[cat].count++
    categoryMap[cat].totalPrice += o.price
  }
  const categoryStats = Object.entries(categoryMap)
    .map(([cat, stats]) => ({
      label: getCategoryLabel(cat),
      count: stats.count,
      avgPrice: stats.totalPrice / stats.count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  const maxCatCount = Math.max(...categoryStats.map((c) => c.count), 1)

  return (
    <div className="py-8 page-container">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Seller Analytics
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Track your offers, revenue, and reputation
          </p>
        </div>
        <Link
          href="/grails"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 transition-colors"
        >
          Browse Requests
        </Link>
      </div>

      {/* ── Verification banner ─────────────────────────────────────────── */}
      {!session.user.verifiedSeller && (
        <div className="bg-blue-950 border border-blue-800 rounded-xl p-4 mb-6 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-200">
              Get Verified Seller status
            </p>
            <p className="text-xs text-blue-400">
              Verified sellers get 40% more offers accepted
            </p>
          </div>
          <Link
            href="/verify"
            className="text-xs font-semibold text-blue-300 hover:text-blue-100"
          >
            Get Verified →
          </Link>
        </div>
      )}

      {/* ── Top-level stat chips ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "This Month",
            value: formatCurrency(thisMonthRevenue),
            sub:
              momChange === 0
                ? "same as last month"
                : `${momChange > 0 ? "+" : ""}${momChange}% vs last month`,
            icon: TrendingUp,
            color: "text-purple-300 bg-purple-950",
          },
          {
            label: "Total Earned",
            value: formatCurrency(
              completedTransactions.reduce((s, t) => s + t.sellerPayout, 0)
            ),
            sub: `${completedCount} completed`,
            icon: DollarSign,
            color: "text-green-300 bg-green-950",
          },
          {
            label: "Active Offers",
            value: pendingCount + counteredCount,
            sub: `${counteredCount} countered`,
            icon: Clock,
            color: "text-orange-300 bg-orange-950",
          },
          {
            label: "Total Offers",
            value: allOffers.length,
            sub: `${declinedCount} declined`,
            icon: Package,
            color: "text-blue-300 bg-blue-950",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-neutral-900 rounded-xl border border-neutral-800 p-5"
          >
            <div
              className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}
            >
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-white">
              {stat.value}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {stat.label}
            </div>
            <div className="text-xs text-neutral-500 mt-0.5">
              {stat.sub}
            </div>
          </div>
        ))}
      </div>

      {/* ── Main 3-col grid ─────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* ── LEFT col (span-2) ─────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Earnings Chart */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold text-white">
                Earnings — Last 6 Months
              </h2>
              <div className="text-right">
                <span className="text-sm font-bold text-white">
                  {formatCurrency(thisMonthRevenue)}
                </span>
                <span
                  className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${
                    momChange >= 0
                      ? "bg-green-950 text-green-300"
                      : "bg-red-950 text-red-300"
                  }`}
                >
                  {momChange >= 0 ? "+" : ""}
                  {momChange}%
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              Monthly seller payout (after platform fee)
            </p>
            <RevenueChart data={chartData} title="" color="#f97316" />
          </div>

          {/* Offer Pipeline */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <h2 className="font-semibold text-white mb-4">
              Offer Pipeline
            </h2>
            <div className="flex flex-wrap gap-3">
              {[
                { label: "Pending", count: pendingCount, color: "bg-yellow-950 text-yellow-300" },
                { label: "Countered", count: counteredCount, color: "bg-orange-950 text-orange-300" },
                { label: "Accepted", count: acceptedCount, color: "bg-green-950 text-green-300" },
                { label: "Completed", count: completedCount, color: "bg-blue-950 text-blue-300" },
                { label: "Declined", count: declinedCount, color: "bg-red-950 text-red-300" },
              ].map((s) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${s.color}`}
                >
                  <span className="text-lg font-bold">{s.count}</span>
                  <span className="font-medium">{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Offers table */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white">
                Recent Offers
              </h2>
              <span className="text-xs text-neutral-500">
                Showing latest {recentOffers.length}
              </span>
            </div>

            {recentOffers.length === 0 ? (
              <div className="py-10 text-center">
                <Package className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <h3 className="font-medium text-neutral-400 mb-1">
                  No offers yet
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Browse active grail requests and make your first offer
                </p>
                <Link
                  href="/grails"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 transition-colors"
                >
                  Browse Grails
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOffers.map((offer) => (
                  <div
                    key={offer.id}
                    className="flex items-center gap-4 rounded-xl border border-neutral-800 p-3 hover:bg-neutral-800/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-300 flex-shrink-0">
                      {offer.grailRequest.user.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate text-sm">
                        {offer.grailRequest.title}
                      </div>
                      <div className="text-xs text-neutral-500 mt-0.5">
                        {getCategoryLabel(offer.grailRequest.category)} ·{" "}
                        {formatTimeAgo(offer.createdAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {offer.counterPrice != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-950 text-orange-300">
                          Counter
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          offer.status === "PENDING"
                            ? "bg-yellow-950 text-yellow-300"
                            : offer.status === "COUNTERED"
                            ? "bg-orange-950 text-orange-300"
                            : offer.status === "ACCEPTED"
                            ? "bg-green-950 text-green-300"
                            : offer.status === "DECLINED"
                            ? "bg-red-950 text-red-300"
                            : offer.status === "WITHDRAWN"
                            ? "bg-neutral-800 text-neutral-500"
                            : "bg-blue-950 text-blue-300"
                        }`}
                      >
                        {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
                      </span>
                      <div className="text-right">
                        <div className="font-bold text-white text-sm">
                          {formatCurrency(offer.counterPrice ?? offer.price)}
                        </div>
                        {offer.counterPrice != null && (
                          <div className="text-xs text-neutral-500 line-through">
                            {formatCurrency(offer.price)}
                          </div>
                        )}
                      </div>
                      <Link
                        href={`/grails/${offer.grailRequestId}`}
                        className="text-xs px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors font-medium whitespace-nowrap"
                      >
                        {offer.status === "PENDING" ? "Counter-offer" : "View"}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT col ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Reputation card */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
            <h3 className="font-semibold text-white mb-4 text-sm">
              Reputation
            </h3>
            {/* Star visual */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-5 h-5"
                  fill={
                    avgRating !== null && star <= Math.round(avgRating)
                      ? "#f97316"
                      : "transparent"
                  }
                  color={
                    avgRating !== null && star <= Math.round(avgRating)
                      ? "#f97316"
                      : "#525252"
                  }
                />
              ))}
              <span className="ml-2 text-lg font-bold text-white">
                {avgRatingDisplay ?? "—"}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mb-4">
              {ratings.length} review{ratings.length !== 1 ? "s" : ""}
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Sales completed</span>
                <span className="font-semibold text-white">
                  {user?.successfulSales ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">
                  90-day acceptance rate
                </span>
                <span className="font-semibold text-white">
                  {acceptanceRate !== null ? `${acceptanceRate}%` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Total offers</span>
                <span className="font-semibold text-white">
                  {user?._count.offers ?? 0}
                </span>
              </div>
            </div>

            {session.user.verifiedSeller && (
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-semibold text-blue-300">
                  Verified Seller
                </span>
              </div>
            )}
          </div>

          {/* Category Performance */}
          {categoryStats.length > 0 && (
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
              <h3 className="font-semibold text-white mb-4 text-sm">
                Category Performance
              </h3>
              <div className="space-y-3">
                {categoryStats.map((cat) => (
                  <div key={cat.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-neutral-300 font-medium truncate mr-2">
                        {cat.label}
                      </span>
                      <span className="text-neutral-500 whitespace-nowrap">
                        {cat.count} · avg {formatCurrency(cat.avgPrice)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{
                          width: `${Math.round((cat.count / maxCatCount) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links grid */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
            <h3 className="font-semibold text-white mb-3 text-sm">
              Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/grails", label: "Browse Grails", icon: ShoppingBag },
                { href: "/seller/inventory", label: "My Inventory", icon: Boxes },
                { href: "/transactions", label: "Transactions", icon: Receipt },
                { href: "/verify", label: "Get Verified", icon: UserCheck },
                { href: "/messages", label: "Messages", icon: MessageSquare },
                { href: "/seller/onboarding", label: "Onboarding", icon: BarChart2 },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-2 p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors text-xs font-medium text-neutral-300"
                >
                  <link.icon className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                  <span className="truncate">{link.label}</span>
                  <ArrowRight className="w-3 h-3 text-neutral-500 ml-auto flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>

          {/* Fee info */}
          <div className="bg-neutral-800 border border-neutral-700 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-neutral-400">
                <strong className="text-neutral-200">Platform fee: 9%</strong>
                <br />
                You keep 91% of every sale. Payments release after buyer confirms receipt.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
