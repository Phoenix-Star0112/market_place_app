import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Trophy, Plus, Eye, Package, Clock, CheckCircle, XCircle, Pause } from "lucide-react"
import { formatCurrency, formatDate, getCategoryLabel } from "@/lib/utils"
import { calcGrailScore } from "@/lib/grailScore"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  ACTIVE:      { label: "Active",      color: "bg-green-100 text-green-800",  icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-800",    icon: Pause },
  COMPLETED:   { label: "Completed",   color: "bg-purple-100 text-purple-800", icon: CheckCircle },
  CANCELLED:   { label: "Cancelled",   color: "bg-red-100 text-red-800",      icon: XCircle },
}

export default async function BuyerRequestsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const grails = await prisma.grailRequest.findMany({
    where: { userId: session.user.id },
    include: {
      offers: { select: { id: true, status: true, price: true } },
      _count: { select: { offers: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = {
    active:    grails.filter((g) => g.status === "ACTIVE").length,
    offers:    grails.reduce((s, g) => s + g.offers.filter((o) => o.status === "PENDING").length, 0),
    completed: grails.filter((g) => g.status === "COMPLETED").length,
    total:     grails.length,
  }

  return (
    <div className="py-8 page-container">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Grail Requests</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all your grail requests in one place</p>
        </div>
        <Link href="/buyer/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" /> New Request
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Requests", value: stats.total, color: "text-slate-900" },
          { label: "Active", value: stats.active, color: "text-green-700" },
          { label: "Pending Offers", value: stats.offers, color: "text-yellow-700" },
          { label: "Completed", value: stats.completed, color: "text-purple-700" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {grails.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-16 text-center">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-medium text-slate-600 mb-1">No requests yet</h3>
          <p className="text-sm text-slate-400 mb-5">Post your first grail request and let sellers find you</p>
          <Link href="/buyer/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
            <Plus className="w-4 h-4" /> Post a Grail
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Request</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden sm:table-cell">Budget</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Offers</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 hidden lg:table-cell">Posted</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {grails.map((grail) => {
                const images = JSON.parse(grail.images) as string[]
                const pending = grail.offers.filter((o) => o.status === "PENDING").length
                const cfg = STATUS_CONFIG[grail.status] || STATUS_CONFIG.ACTIVE
                const StatusIcon = cfg.icon
                const score = calcGrailScore({ category: grail.category, budgetMax: grail.budgetMax, offersCount: grail._count.offers, views: grail.views, createdAt: grail.createdAt })

                return (
                  <tr key={grail.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {images[0]
                            ? <img src={images[0]} alt="" className="w-full h-full object-cover" />
                            : <Trophy className="w-5 h-5 text-slate-300 m-auto mt-2.5" />}
                        </div>
                        <div>
                          <Link href={`/grails/${grail.id}`} className="font-medium text-slate-900 hover:text-yellow-600 line-clamp-1 max-w-[200px]">
                            {grail.title}
                          </Link>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> {grail.views}
                            <span className="ml-1 text-slate-300">·</span>
                            <span className="text-yellow-600 font-semibold">Score {score}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100">{getCategoryLabel(grail.category)}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 hidden sm:table-cell">
                      {formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {pending > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                          <Package className="w-3 h-3" /> {pending} new
                        </span>
                      ) : (
                        <span className="text-slate-500 text-xs">{grail._count.offers} total</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell">{formatDate(grail.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.color}`}>
                        <StatusIcon className="w-3 h-3" /> {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/grails/${grail.id}`} className="text-xs font-medium text-yellow-600 hover:text-yellow-700">
                        View →
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
