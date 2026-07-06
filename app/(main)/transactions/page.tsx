import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { DollarSign, TrendingUp, Package, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-800",
  PENDING:   "bg-yellow-100 text-yellow-800",
  FAILED:    "bg-red-100 text-red-800",
}

export default async function TransactionsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const transactions = await prisma.transaction.findMany({
    where: {
      offer: {
        OR: [
          { sellerId: session.user.id },
          { grailRequest: { userId: session.user.id } },
        ],
      },
    },
    include: {
      offer: {
        include: {
          seller: { select: { id: true, name: true, image: true } },
          grailRequest: {
            include: { user: { select: { id: true, name: true, image: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const totals = transactions.reduce(
    (acc, t) => {
      const isSeller = t.offer.sellerId === session.user.id
      return {
        totalAmount:  acc.totalAmount + t.amount,
        totalEarned:  acc.totalEarned + (isSeller ? t.sellerPayout : 0),
        totalSpent:   acc.totalSpent + (!isSeller ? t.amount : 0),
        totalFees:    acc.totalFees + t.platformFee,
        count: acc.count + 1,
      }
    },
    { totalAmount: 0, totalEarned: 0, totalSpent: 0, totalFees: 0, count: 0 }
  )

  return (
    <div className="py-8 page-container max-w-5xl">
      <h1 className="text-2xl font-bold text-white mb-2">Transaction History</h1>
      <p className="text-neutral-500 text-sm mb-8">All your completed and pending transactions</p>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Transactions", value: totals.count.toString(), icon: Package, color: "text-neutral-400 bg-neutral-800" },
          { label: "Total Spent",        value: formatCurrency(totals.totalSpent), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Total Earned",       value: formatCurrency(totals.totalEarned), icon: DollarSign, color: "text-green-600 bg-green-50" },
          { label: "Platform Fees",      value: formatCurrency(totals.totalFees), icon: AlertTriangle, color: "text-amber-600 bg-amber-50" },
        ].map((s) => (
          <div key={s.label} className="bg-neutral-900 rounded-xl border border-neutral-800 p-4">
            <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xl font-bold text-white">{s.value}</div>
            <div className="text-xs text-neutral-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {transactions.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-dashed border-neutral-800 p-16 text-center">
          <DollarSign className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-400">No transactions yet</h3>
          <p className="text-sm text-neutral-500 mt-1">Completed transactions will appear here</p>
        </div>
      ) : (
        <div className="bg-neutral-900 rounded-xl border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800 border-b border-neutral-800">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-neutral-400">Item</th>
                <th className="text-left px-5 py-3 font-semibold text-neutral-400 hidden sm:table-cell">Role</th>
                <th className="text-right px-5 py-3 font-semibold text-neutral-400">Amount</th>
                <th className="text-right px-5 py-3 font-semibold text-neutral-400 hidden md:table-cell">Fee</th>
                <th className="text-right px-5 py-3 font-semibold text-neutral-400 hidden md:table-cell">Net</th>
                <th className="text-left px-5 py-3 font-semibold text-neutral-400 hidden lg:table-cell">Date</th>
                <th className="text-center px-5 py-3 font-semibold text-neutral-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {transactions.map((tx) => {
                const isSeller = tx.offer.sellerId === session.user.id
                const other = isSeller ? tx.offer.grailRequest.user : tx.offer.seller
                return (
                  <tr key={tx.id} className="hover:bg-neutral-800 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/grails/${tx.offer.grailRequestId}`} className="font-medium text-white hover:text-orange-500 line-clamp-1 max-w-[220px] block">
                        {tx.offer.grailRequest.title}
                      </Link>
                      <p className="text-xs text-neutral-500 mt-0.5">with {other.name}</p>
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isSeller ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}`}>
                        {isSeller ? "Seller" : "Buyer"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-white">{formatCurrency(tx.amount)}</td>
                    <td className="px-5 py-4 text-right text-neutral-500 hidden md:table-cell">{formatCurrency(tx.platformFee)}</td>
                    <td className={`px-5 py-4 text-right font-semibold hidden md:table-cell ${isSeller ? "text-green-700" : "text-blue-700"}`}>
                      {isSeller ? `+${formatCurrency(tx.sellerPayout)}` : `-${formatCurrency(tx.amount)}`}
                    </td>
                    <td className="px-5 py-4 text-xs text-neutral-500 hidden lg:table-cell">{formatDate(tx.createdAt)}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_STYLE[tx.status] ?? "bg-neutral-800 text-neutral-400"}`}>
                        {tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                      </span>
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
