import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency, formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  Users, Trophy, DollarSign, ShieldAlert, CheckCircle,
  AlertTriangle, TrendingUp, Calendar, Eye, ShieldCheck,
  BarChart3, Package,
} from "lucide-react"

// ─── Server Actions ───────────────────────────────────────────────────────────
async function verifyUser(formData: FormData) {
  "use server"
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return
  const id = formData.get("id") as string
  await prisma.user.update({ where: { id }, data: { verified: true } })
  revalidatePath("/admin")
}

async function resolveDispute(formData: FormData) {
  "use server"
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== "ADMIN") return
  const id = formData.get("id") as string
  await prisma.notification.update({ where: { id }, data: { read: true } })
  revalidatePath("/admin")
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; filter?: string }>
}) {
  const { tab = "overview", filter = "all" } = await searchParams
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  const now = new Date()
  const sevenDaysAgo  = new Date(now.getTime() - 7 * 86_400_000)
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1)
  const sixMonthsAgo  = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const [
    totalUsers, buyers, sellers, verifiedCount, newLastWeek,
    activeGrails, completedGrails, viewsAggregate,
    totalRevenue, monthRevenue, disputes,
    recentUsers, recentGrails, topSellers, sparklineTxns,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "BUYER" } }),
    prisma.user.count({ where: { role: "SELLER" } }),
    prisma.user.count({ where: { verified: true } }),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.grailRequest.count({ where: { status: "ACTIVE" } }),
    prisma.grailRequest.count({ where: { status: "COMPLETED" } }),
    prisma.grailRequest.aggregate({ _sum: { views: true } }),
    prisma.transaction.aggregate({ where: { status: "COMPLETED" }, _sum: { platformFee: true } }),
    prisma.transaction.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfMonth } }, _sum: { platformFee: true } }),
    prisma.notification.findMany({
      where: { type: "DISPUTE" },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" }, take: 10,
      select: { id: true, name: true, email: true, role: true, verified: true, verifiedSeller: true, successfulSales: true, createdAt: true },
    }),
    prisma.grailRequest.findMany({
      orderBy: { createdAt: "desc" }, take: 8,
      include: { user: { select: { name: true } }, _count: { select: { offers: true } } },
    }),
    prisma.user.findMany({
      orderBy: { successfulSales: "desc" }, take: 5,
      select: { id: true, name: true, email: true, successfulSales: true, verified: true, verifiedSeller: true },
    }),
    prisma.transaction.findMany({
      where: { status: "COMPLETED", createdAt: { gte: sixMonthsAgo } },
      select: { platformFee: true, createdAt: true },
    }),
  ])

  // Sparkline
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  const monthLabels: string[] = []
  const monthData: number[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push(MONTHS[d.getMonth()])
    monthData.push(0)
  }
  for (const t of sparklineTxns) {
    const d = new Date(t.createdAt)
    const idx = 5 - ((now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth()))
    if (idx >= 0 && idx < 6) monthData[idx] += t.platformFee
  }
  const maxSpk = Math.max(...monthData, 1)
  const SW = 260, SH = 60
  const pts = monthData.map((v, i) => {
    const x = (i / 5) * (SW - 16) + 8
    const y = SH - 8 - ((v / maxSpk) * (SH - 16))
    return `${x},${y}`
  })

  // All users for filter
  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, verified: true, verifiedSeller: true, successfulSales: true, createdAt: true },
  })
  const filteredUsers = allUsers.filter(u => {
    if (filter === "buyers")   return u.role === "BUYER"
    if (filter === "sellers")  return u.role === "SELLER"
    if (filter === "verified") return u.verified
    if (filter === "unverified") return !u.verified
    return true
  })

  const pendingDisputes = disputes.filter(d => !d.read)

  const TABS = [
    { key: "overview", label: "Overview" },
    { key: "users",    label: `Users (${totalUsers})` },
    { key: "disputes", label: `Disputes${pendingDisputes.length > 0 ? ` (${pendingDisputes.length})` : ""}` },
  ]

  const STATS = [
    { label: "Total Users",       value: totalUsers.toLocaleString(),  sub: `+${newLastWeek} this week`, icon: Users,         accent: "#3b82f6", bg: "#eff6ff", darkBg: "#1e3a5f" },
    { label: "Active Grails",     value: activeGrails.toLocaleString(), sub: `${completedGrails} completed`, icon: Trophy,   accent: "#f59e0b", bg: "#fffbeb", darkBg: "#451a03" },
    { label: "Platform Revenue",  value: formatCurrency(totalRevenue._sum.platformFee ?? 0), sub: "all time", icon: DollarSign, accent: "#10b981", bg: "#ecfdf5", darkBg: "#052e16" },
    { label: "This Month",        value: formatCurrency(monthRevenue._sum.platformFee ?? 0), sub: MONTHS[now.getMonth()], icon: TrendingUp, accent: "#8b5cf6", bg: "#f5f3ff", darkBg: "#2e1065" },
    { label: "Verified Sellers",  value: verifiedCount.toLocaleString(), sub: `of ${sellers} sellers`, icon: ShieldCheck, accent: "#06b6d4", bg: "#ecfeff", darkBg: "#083344" },
    { label: "Pending Disputes",  value: pendingDisputes.length.toLocaleString(), sub: `${disputes.length} total`, icon: AlertTriangle, accent: "#ef4444", bg: "#fef2f2", darkBg: "#450a0a" },
  ]

  return (
    <div className="py-8 page-container">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Platform overview and management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b-2 border-slate-200 dark:border-slate-700">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`relative px-5 py-3 text-sm font-semibold transition-colors ${
              tab === t.key
                ? "text-yellow-600 dark:text-yellow-400"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
            {tab === t.key && (
              <span className="absolute bottom-[-2px] left-0 right-0 h-0.5 bg-yellow-400 rounded-full" />
            )}
          </Link>
        ))}
      </div>

      {/* ── OVERVIEW ─────────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-8">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {STATS.map(({ label, value, sub, icon: Icon, accent, bg }) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 transition-shadow hover:shadow-md bg-white dark:bg-slate-800"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: bg }}
                >
                  <Icon className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div className="text-2xl font-extrabold tabular-nums" style={{ color: accent }}>
                  {value}
                </div>
                <div className="text-sm font-bold mt-0.5" style={{ color: "inherit" }}>{label}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{sub}</div>
              </div>
            ))}
          </div>

          {/* Revenue chart */}
          <div
            className="rounded-2xl border border-slate-200 dark:border-slate-700 p-6 bg-white dark:bg-slate-800"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-yellow-500" />
                <h2 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Revenue — Last 6 Months</h2>
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Platform fees</span>
            </div>
            <svg viewBox={`0 0 ${SW} ${SH}`} className="w-full" style={{ height: 80 }} aria-hidden="true">
              <defs>
                <linearGradient id="rev-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon
                points={`8,${SH} ${pts.join(" ")} ${SW - 8},${SH}`}
                fill="url(#rev-grad)"
              />
              <polyline fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={pts.join(" ")} />
              {monthData.map((_, i) => {
                const x = (i / 5) * (SW - 16) + 8
                const y = SH - 8 - ((monthData[i] / maxSpk) * (SH - 16))
                return <circle key={i} cx={x} cy={y} r={i === 5 ? 4 : 3} fill={i === 5 ? "#3b82f6" : "#93c5fd"} />
              })}
            </svg>
            <div className="flex justify-between mt-2">
              {monthLabels.map(l => <span key={l} className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{l}</span>)}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Users */}
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-400" /> Recent Users
              </h2>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((u, i) => (
                      <tr key={u.id} className={`transition-colors hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 ${i < recentUsers.length - 1 ? "border-b border-slate-50 dark:border-slate-800" : ""}`}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-xs font-bold text-yellow-700 dark:text-yellow-300">
                              {(u.name ?? u.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900 dark:text-slate-100 text-xs leading-tight">{u.name ?? "—"}</div>
                              <div className="text-xs text-slate-400 dark:text-slate-500 max-w-[130px] truncate">{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Grails */}
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-slate-400" /> Recent Grail Requests
              </h2>
              <div className="space-y-2">
                {recentGrails.map((g) => (
                  <div key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3 transition-colors hover:border-yellow-300 dark:hover:border-yellow-700 bg-white dark:bg-slate-800">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{g.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{g.user.name ?? "Unknown"}</span>
                        <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{g._count.offers}</span>
                        <span className="flex items-center gap-0.5"><Eye className="w-3 h-3" />{g.views}</span>
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                      g.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                    }`}>
                      {g.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Sellers */}
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-400" /> Top Sellers
            </h2>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    {["#", "Seller", "Sales", "Status"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topSellers.map((s, i) => (
                    <tr key={s.id} className={`transition-colors hover:bg-yellow-50/50 dark:hover:bg-yellow-900/10 ${i < topSellers.length - 1 ? "border-b border-slate-50 dark:border-slate-800" : ""}`}>
                      <td className="px-4 py-3 text-slate-400 font-bold text-xs">{["🥇","🥈","🥉"][i] ?? i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{s.name ?? "—"}</div>
                        <div className="text-xs text-slate-400">{s.email}</div>
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{s.successfulSales}</td>
                      <td className="px-4 py-3">
                        {s.verifiedSeller
                          ? <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">Verified</span>
                          : <span className="text-xs text-slate-400">Unverified</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── USERS TAB ────────────────────────────────────────────────────────── */}
      {tab === "users" && (
        <div className="space-y-5">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all",        label: "All Users" },
              { key: "buyers",     label: "Buyers" },
              { key: "sellers",    label: "Sellers" },
              { key: "verified",   label: "Verified" },
              { key: "unverified", label: "Unverified" },
            ].map(f => (
              <Link
                key={f.key}
                href={`/admin?tab=users&filter=${f.key}`}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all border ${
                  filter === f.key
                    ? "bg-yellow-400 border-yellow-400 text-slate-900"
                    : "bg-transparent border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-yellow-300 dark:hover:border-yellow-700"
                }`}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {/* Users table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  {["User", "Role", "Verified", "Sales", "Joined", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} className={`transition-colors hover:bg-yellow-50/40 dark:hover:bg-yellow-900/10 ${i < filteredUsers.length - 1 ? "border-b border-slate-50 dark:border-slate-800" : ""}`}>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-sm font-bold text-yellow-700 dark:text-yellow-300 flex-shrink-0">
                          {(u.name ?? u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{u.name ?? "—"}</div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 max-w-[200px] truncate">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-4 py-3.5">
                      {u.verified
                        ? <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold"><CheckCircle className="w-3.5 h-3.5" />Verified</span>
                        : <span className="text-xs text-slate-400 dark:text-slate-500">—</span>}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{u.successfulSales}</td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        {!u.verified && (
                          <form action={verifyUser}>
                            <input type="hidden" name="id" value={u.id} />
                            <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors">
                              Verify
                            </button>
                          </form>
                        )}
                        <button type="button" disabled className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-400 font-semibold cursor-not-allowed opacity-50">
                          Ban
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400 dark:text-slate-500 text-sm">No users match this filter.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DISPUTES TAB ─────────────────────────────────────────────────────── */}
      {tab === "disputes" && (
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span className={pendingDisputes.length > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}>
              {pendingDisputes.length} unresolved
            </span>
            {" · "}{disputes.length} total
          </p>

          {disputes.length === 0 && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-16 text-center bg-white dark:bg-slate-800">
              <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-500" />
              </div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">No disputes reported.</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">The platform is running smoothly.</p>
            </div>
          )}

          {disputes.map((d) => (
            <div key={d.id} className={`rounded-2xl border p-5 transition-all bg-white dark:bg-slate-800 ${
              d.read
                ? "border-slate-200 dark:border-slate-700"
                : "border-red-200 dark:border-red-800/50 ring-1 ring-red-100 dark:ring-red-900/30"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {!d.read && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-bold uppercase tracking-wide">Unresolved</span>}
                    {d.read && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wide">Resolved</span>}
                    <span className="text-xs text-slate-400 dark:text-slate-500">{formatDate(d.createdAt)}</span>
                  </div>
                  <p className="font-bold text-slate-900 dark:text-slate-100">{d.title}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">{d.message}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">By: {d.user.name ?? d.user.email}</p>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {d.link && (
                    <Link href={d.link} className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-center transition-colors">
                      View Grail
                    </Link>
                  )}
                  {!d.read && (
                    <form action={resolveDispute}>
                      <input type="hidden" name="id" value={d.id} />
                      <button type="submit" className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors w-full">
                        Resolve
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const s: Record<string, string> = {
    ADMIN:  "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800",
    SELLER: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    BUYER:  "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
  }
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${s[role] ?? "bg-slate-100 text-slate-600 border border-slate-200"}`}>
      {role}
    </span>
  )
}
