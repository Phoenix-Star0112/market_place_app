"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Bookmark, Trophy, Package, Loader2, Trash2 } from "lucide-react"
import { formatCurrency, formatTimeAgo, getCategoryLabel } from "@/lib/utils"
import { useToast } from "@/components/Toast"

interface Saved {
  id: string
  createdAt: string
  grailRequest: {
    id: string; title: string; category: string; budgetMin: number; budgetMax: number
    images: string; status: string
    user: { id: string; name: string | null; image: string | null; verified: boolean }
    _count: { offers: number }
  }
}

export default function SavedGrailsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [saved, setSaved] = useState<Saved[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status !== "authenticated") return
    fetch("/api/saved")
      .then((r) => r.json())
      .then((d) => { setSaved(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, router])

  async function handleRemove(grailRequestId: string) {
    setRemoving(grailRequestId)
    const res = await fetch("/api/saved", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grailRequestId }),
    })
    const data = await res.json()
    if (!data.saved) {
      setSaved((prev) => prev.filter((s) => s.grailRequest.id !== grailRequestId))
      success("Removed", "Grail removed from your watchlist")
    } else {
      toastError("Error", "Could not remove from watchlist")
    }
    setRemoving(null)
  }

  if (status === "loading" || loading) {
    return (
      <div className="py-16 page-container flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="py-8 page-container max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Bookmark className="w-6 h-6 text-yellow-500" fill="currentColor" /> Saved Watchlist
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Grails you&apos;re watching as a seller — get notified when buyers accept offers
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-16 text-center">
          <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-medium text-slate-600 mb-1">No saved grails</h3>
          <p className="text-sm text-slate-400 mb-5">Save grails from the browse page to track them here</p>
          <Link href="/grails" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
            Browse Grails
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {saved.map(({ id, grailRequest: g, createdAt }) => {
            const images = JSON.parse(g.images) as string[]
            return (
              <div key={id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-sm transition-all group">
                <Link href={`/grails/${g.id}`}>
                  <div className="h-32 bg-slate-100 overflow-hidden">
                    {images[0]
                      ? <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      : <div className="flex items-center justify-center h-full"><Trophy className="w-8 h-8 text-slate-300" /></div>}
                  </div>
                </Link>
                <div className="p-4">
                  <Link href={`/grails/${g.id}`} className="font-semibold text-slate-900 hover:text-yellow-600 text-sm line-clamp-2">
                    {g.title}
                  </Link>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">{getCategoryLabel(g.category)}</span>
                    <span className="text-sm font-semibold text-yellow-600">{formatCurrency(g.budgetMin)}–{formatCurrency(g.budgetMax)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Package className="w-3.5 h-3.5" /> {g._count.offers} offers · saved {formatTimeAgo(createdAt)}
                    </div>
                    <button
                      onClick={() => handleRemove(g.id)}
                      disabled={removing === g.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      {removing === g.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
