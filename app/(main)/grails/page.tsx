"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, Trophy, Package, Plus, Loader2, Bookmark, ArrowUpDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react"
import { formatCurrency, formatTimeAgo, getCategoryLabel, CATEGORIES } from "@/lib/utils"
import { GrailScoreBadge, calcGrailScore } from "@/components/GrailScoreBadge"
import { useToast } from "@/components/Toast"

interface GrailRequest {
  id: string; title: string; description: string; category: string; condition: string
  budgetMin: number; budgetMax: number; images: string; status: string; views: number; createdAt: string
  user: { id: string; name: string | null; image: string | null; verified: boolean }
  _count: { offers: number }
}

type SortOption = "newest" | "offers" | "budget_high" | "budget_low" | "score"
type ViewMode = "grid" | "list"

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest First", offers: "Most Offers", budget_high: "Budget: High→Low",
  budget_low: "Budget: Low→High", score: "GrailScore™",
}

function GrailsContent() {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const { success, info } = useToast()
  const [grails, setGrails] = useState<GrailRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all")
  const [sortBy, setSortBy] = useState<SortOption>("newest")
  const [view, setView] = useState<ViewMode>("grid")
  const [showFilters, setShowFilters] = useState(false)
  const [budgetMin, setBudgetMin] = useState("")
  const [budgetMax, setBudgetMax] = useState("")
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchGrails = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (selectedCategory !== "all") params.set("category", selectedCategory)
    params.set("page", page.toString())
    params.set("limit", "12")
    const res = await fetch(`/api/grails?${params}`)
    const data = await res.json()
    setGrails(data.grails || [])
    setTotal(data.pagination?.total || 0)
    setLoading(false)
  }, [search, selectedCategory, page])

  useEffect(() => { fetchGrails() }, [fetchGrails])

  useEffect(() => {
    if (!session) return
    fetch("/api/saved").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setSavedIds(new Set(d.map((s: any) => s.grailRequest.id)))
    }).catch(() => {})
  }, [session])

  async function handleSave(e: React.MouseEvent, grailId: string) {
    e.preventDefault(); e.stopPropagation()
    if (!session) { info("Sign in required", "Create a free account to save grails to your watchlist"); return }
    setSavingId(grailId)
    const res = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grailRequestId: grailId }) })
    const data = await res.json()
    setSavedIds((prev) => { const next = new Set(prev); data.saved ? next.add(grailId) : next.delete(grailId); return next })
    data.saved ? success("Saved!", "Added to your watchlist") : info("Removed", "Removed from watchlist")
    setSavingId(null)
  }

  function sortGrails(list: GrailRequest[]) {
    const scored = list.map((g) => ({ ...g, _score: calcGrailScore({ category: g.category, budgetMax: g.budgetMax, offersCount: g._count.offers, views: g.views, createdAt: g.createdAt, verified: g.user.verified }) }))
    let filtered = scored
    if (budgetMin) filtered = filtered.filter((g) => g.budgetMax >= parseFloat(budgetMin))
    if (budgetMax) filtered = filtered.filter((g) => g.budgetMin <= parseFloat(budgetMax))
    switch (sortBy) {
      case "offers":      return [...filtered].sort((a, b) => b._count.offers - a._count.offers)
      case "budget_high": return [...filtered].sort((a, b) => b.budgetMax - a.budgetMax)
      case "budget_low":  return [...filtered].sort((a, b) => a.budgetMin - b.budgetMin)
      case "score":       return [...filtered].sort((a, b) => b._score - a._score)
      default:            return [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
  }

  const displayed = sortGrails(grails)

  return (
    <div className="py-8 page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Browse Grail Requests</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total.toLocaleString()} active requests from collectors</p>
        </div>
        <Link href="/buyer/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
          <Plus className="w-4 h-4" /> Post a Grail
        </Link>
      </div>

      {/* Search bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1) }} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by player, card, year, grade..." className="input-field pl-9" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">Search</button>
          <button type="button" onClick={() => setShowFilters(!showFilters)} className={`px-3 py-2 rounded-lg border text-slate-600 text-sm transition-all ${showFilters ? "bg-slate-100 border-slate-300" : "border-slate-200 hover:bg-slate-50"}`}>
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </form>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-3 items-end">
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Min Budget ($)</p>
              <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} placeholder="0" className="input-field w-28" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-600 mb-1">Max Budget ($)</p>
              <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} placeholder="Any" className="input-field w-28" />
            </div>
            <button onClick={() => { setBudgetMin(""); setBudgetMax("") }} className="text-xs text-slate-500 hover:text-slate-700 underline pb-1">Clear</button>
          </div>
        )}

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mt-3 pt-3 border-t border-slate-100">
          <button onClick={() => { setSelectedCategory("all"); setPage(1) }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === "all" ? "bg-yellow-400 text-yellow-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            All
          </button>
          {CATEGORIES.map((cat) => (
            <button key={cat.value} onClick={() => { setSelectedCategory(cat.value); setPage(1) }} className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === cat.value ? "bg-yellow-400 text-yellow-900" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-700 focus:outline-none focus:border-yellow-400">
            {(Object.keys(SORT_LABELS) as SortOption[]).map((s) => (
              <option key={s} value={s}>{SORT_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={() => setView("grid")} className={`p-1.5 rounded ${view === "grid" ? "bg-yellow-100 text-yellow-700" : "text-slate-400 hover:text-slate-600"}`}><LayoutGrid className="w-4 h-4" /></button>
          <button onClick={() => setView("list")} className={`p-1.5 rounded ${view === "list" ? "bg-yellow-100 text-yellow-700" : "text-slate-400 hover:text-slate-600"}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={`grid gap-4 ${view === "grid" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" : ""}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
              <div className="w-full h-36 bg-slate-100 rounded-lg mb-4" />
              <div className="h-4 bg-slate-100 rounded mb-2" /><div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-medium text-slate-600 mb-1">No grails found</h3>
          <p className="text-sm text-slate-400 mb-5">Try adjusting your search or post the first in this category</p>
          <Link href="/buyer/create" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-400 text-slate-900 font-semibold text-sm hover:bg-yellow-300 transition-colors">
            <Plus className="w-4 h-4" /> Post a Grail
          </Link>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((grail) => {
            const images = JSON.parse(grail.images) as string[]
            const score = (grail as any)._score ?? calcGrailScore({ category: grail.category, budgetMax: grail.budgetMax, offersCount: grail._count.offers, views: grail.views, createdAt: grail.createdAt })
            const isSaved = savedIds.has(grail.id)
            return (
              <div key={grail.id} className="relative bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all group">
                <Link href={`/grails/${grail.id}`}>
                  <div className="h-36 bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center overflow-hidden">
                    {images[0] ? <img src={images[0]} alt={grail.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <Trophy className="w-10 h-10 text-slate-300" />}
                  </div>
                </Link>
                {/* Save button */}
                <button onClick={(e) => handleSave(e, grail.id)} className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all ${isSaved ? "bg-yellow-400 text-yellow-900" : "bg-black/20 text-white hover:bg-yellow-400 hover:text-yellow-900"}`}>
                  {savingId === grail.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} />}
                </button>
                {/* GrailScore */}
                <div className="absolute top-2 left-2">
                  <GrailScoreBadge score={score} size="sm" animated={false} />
                </div>
                <Link href={`/grails/${grail.id}`}>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{grail.title}</h3>
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{grail.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{getCategoryLabel(grail.category)}</span>
                      <span className="text-sm font-bold text-yellow-600">{formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full overflow-hidden bg-yellow-100 flex items-center justify-center text-[10px] font-bold text-yellow-900">
                          {grail.user.image ? <img src={grail.user.image} alt="" className="w-full h-full object-cover" /> : grail.user.name?.[0]?.toUpperCase()}
                        </div>
                        <span className="text-xs text-slate-500">{grail.user.name}</span>
                        {grail.user.verified && <span className="text-blue-500 text-xs">✓</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" />{grail._count.offers}</span>
                        <span>{formatTimeAgo(grail.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-2">
          {displayed.map((grail) => {
            const images = JSON.parse(grail.images) as string[]
            const score = (grail as any)._score ?? calcGrailScore({ category: grail.category, budgetMax: grail.budgetMax, offersCount: grail._count.offers, views: grail.views, createdAt: grail.createdAt })
            const isSaved = savedIds.has(grail.id)
            return (
              <div key={grail.id} className="flex items-center gap-4 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm hover:border-slate-300 transition-all group">
                <Link href={`/grails/${grail.id}`} className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {images[0] ? <img src={images[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="flex items-center justify-center h-full"><Trophy className="w-5 h-5 text-slate-300" /></div>}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/grails/${grail.id}`} className="font-semibold text-slate-900 hover:text-yellow-600 text-sm truncate block">{grail.title}</Link>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                    <span className="px-1.5 py-0.5 rounded-full bg-slate-100">{getCategoryLabel(grail.category)}</span>
                    <span className="flex items-center gap-0.5"><Package className="w-3 h-3" />{grail._count.offers}</span>
                    <span>{formatTimeAgo(grail.createdAt)}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-3">
                  <GrailScoreBadge score={score} size="sm" animated={false} />
                  <div className="text-right">
                    <div className="font-bold text-yellow-600 text-sm">{formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}</div>
                    {grail.user.verified && <span className="text-xs text-blue-500">✓ Verified</span>}
                  </div>
                  <button onClick={(e) => handleSave(e, grail.id)} className={`p-1.5 rounded-lg transition-all ${isSaved ? "text-yellow-600 bg-yellow-50" : "text-slate-400 hover:text-yellow-600 hover:bg-yellow-50"}`}>
                    {savingId === grail.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {total > 12 && (
        <div className="flex justify-center gap-2 mt-8">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">← Prev</button>
          <span className="px-4 py-2 text-sm text-slate-500">Page {page} of {Math.ceil(total / 12)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / 12)} className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  )
}

export default function BrowseGrailsPage() {
  return (
    <Suspense fallback={<div className="py-16 page-container flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>}>
      <GrailsContent />
    </Suspense>
  )
}
