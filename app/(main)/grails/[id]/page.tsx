"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  ArrowLeft, Eye, Package, Clock, Star, ShieldCheck,
  CheckCircle, X, Loader2, MessageSquare, DollarSign,
  AlertTriangle, Share2, Bookmark, Trophy, Copy,
} from "lucide-react"
import {
  formatCurrency, formatTimeAgo, formatDate,
  getCategoryLabel, getConditionLabel, CONDITIONS,
} from "@/lib/utils"
import { GrailScoreBadge, calcGrailScore } from "@/components/GrailScoreBadge"
import { ImageGallery } from "@/components/ImageGallery"
import { OfferComparison } from "@/components/OfferComparison"
import { MarketPulse } from "@/components/MarketPulse"
import { useToast } from "@/components/Toast"

interface GrailDetail {
  id: string; title: string; description: string; category: string; condition: string
  budgetMin: number; budgetMax: number; images: string; status: string; views: number; createdAt: string; userId: string
  user: { id: string; name: string | null; image: string | null; verified: boolean; verifiedSeller: boolean; createdAt: string; _count: { grailRequests: number } }
  offers: Array<{
    id: string; price: number; description: string; condition: string; images: string; status: string; createdAt: string
    seller: { id: string; name: string | null; image: string | null; verified: boolean; verifiedSeller: boolean; successfulSales: number; ratingsReceived: Array<{ score: number }> }
  }>
  _count: { offers: number }
}

interface MarketData {
  avgPrice: number; priceChange: number; activeGrails: number; completedThisMonth: number; hotness: "🔥" | "📈" | "➡️" | "📉"; category: string
}

export default function GrailDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { success, error: toastError, info } = useToast()
  const [grail, setGrail] = useState<GrailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [showOfferForm, setShowOfferForm] = useState(false)
  const [submittingOffer, setSubmittingOffer] = useState(false)
  const [offerForm, setOfferForm] = useState({ price: "", description: "", condition: "" })
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [savingWatch, setSavingWatch] = useState(false)
  const [activeTab, setActiveTab] = useState<"all" | "compare">("all")

  useEffect(() => {
    fetch(`/api/grails/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setGrail(data)
        setLoading(false)
        fetch(`/api/market?category=${data.category}`).then((r) => r.json()).then(setMarketData).catch(() => {})
      })
      .catch(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!session || !grail) return
    fetch("/api/saved").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setIsSaved(d.some((s: any) => s.grailRequest.id === grail.id))
    }).catch(() => {})
  }, [session, grail])

  async function toggleSave() {
    if (!session) { info("Sign in required", "Create an account to save grails"); return }
    setSavingWatch(true)
    const res = await fetch("/api/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ grailRequestId: id }) })
    const data = await res.json()
    setIsSaved(data.saved)
    data.saved ? success("Saved!", "Added to your watchlist") : info("Removed", "Removed from watchlist")
    setSavingWatch(false)
  }

  async function handleShare() {
    try {
      await navigator.clipboard.writeText(window.location.href)
      success("Link copied!", "Share this grail request with others")
    } catch {
      info("Share", window.location.href)
    }
  }

  async function submitOffer(e: React.FormEvent) {
    e.preventDefault()
    if (!session) { router.push("/login"); return }
    setSubmittingOffer(true)
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ grailRequestId: id, price: parseFloat(offerForm.price), description: offerForm.description, condition: offerForm.condition, images: [] }),
    })
    const data = await res.json()
    if (!res.ok) { toastError("Error", data.error || "Failed to submit offer"); setSubmittingOffer(false); return }
    success("Offer submitted!", "The buyer will be notified of your offer")
    setShowOfferForm(false)
    setSubmittingOffer(false)
    const updated = await fetch(`/api/grails/${id}`).then((r) => r.json())
    setGrail(updated)
  }

  async function handleOfferAction(offerId: string, status: "ACCEPTED" | "DECLINED") {
    setActionLoading(offerId)
    const res = await fetch(`/api/offers/${offerId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) })
    if (res.ok) {
      status === "ACCEPTED" ? success("Offer accepted!", "Proceed to checkout to complete the purchase") : info("Offer declined", "The seller has been notified")
      const updated = await fetch(`/api/grails/${id}`).then((r) => r.json())
      setGrail(updated)
    } else {
      toastError("Error", "Could not update offer status")
    }
    setActionLoading(null)
  }

  if (loading) return <div className="py-16 page-container flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
  if (!grail) return (
    <div className="py-16 page-container text-center">
      <Trophy className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
      <h2 className="font-semibold text-neutral-300">Grail request not found</h2>
      <Link href="/grails" className="text-orange-500 text-sm mt-2 inline-block hover:text-orange-400">← Browse all grails</Link>
    </div>
  )

  const images = JSON.parse(grail.images) as string[]
  const isOwner = session?.user.id === grail.userId
  const isSeller = session && !isOwner
  const pendingOffers = grail.offers.filter((o) => o.status === "PENDING")
  const score = calcGrailScore({ category: grail.category, budgetMax: grail.budgetMax, offersCount: grail._count.offers, views: grail.views, createdAt: grail.createdAt, verified: grail.user.verified })

  return (
    <div className="py-8 page-container">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/grails" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Browse
        </Link>
        <span className="text-neutral-700">/</span>
        <span className="text-sm text-white font-medium truncate max-w-xs">{grail.title}</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Header card */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="p-6">
              {/* Status + badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-xs px-2.5 py-1 rounded-full bg-neutral-800 text-neutral-300 font-medium">{getCategoryLabel(grail.category)}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${grail.status === "ACTIVE" ? "bg-green-100 text-green-800" : grail.status === "IN_PROGRESS" ? "bg-blue-100 text-blue-800" : grail.status === "COMPLETED" ? "bg-purple-100 text-purple-800" : "bg-neutral-800 text-neutral-300"}`}>
                  {grail.status.replace("_", " ").charAt(0) + grail.status.replace("_", " ").slice(1).toLowerCase()}
                </span>
                <GrailScoreBadge score={score} size="sm" showLabel />
              </div>

              <h1 className="text-2xl font-bold text-white mb-2">{grail.title}</h1>
              <p className="text-neutral-400 leading-relaxed text-sm mb-5">{grail.description}</p>

              {/* Image gallery */}
              <ImageGallery images={images} title={grail.title} thumbnailClass="h-56" />

              {/* Meta row */}
              <div className="flex flex-wrap gap-5 mt-5 pt-5 border-t border-neutral-800 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> Budget: <strong className="text-white">{formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}</strong></span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4" /> Condition: <strong className="text-white">{getConditionLabel(grail.condition)}</strong></span>
                <span className="flex items-center gap-1.5"><Eye className="w-4 h-4" /> {grail.views} views</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {formatTimeAgo(grail.createdAt)}</span>
              </div>

              {/* Action row */}
              <div className="flex flex-wrap gap-2 mt-5">
                <button onClick={toggleSave} disabled={savingWatch} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${isSaved ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "border-neutral-800 text-neutral-400 hover:border-orange-500/20 hover:bg-orange-500/10"}`}>
                  {savingWatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bookmark className="w-3.5 h-3.5" fill={isSaved ? "currentColor" : "none"} />}
                  {isSaved ? "Saved" : "Save"}
                </button>
                <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 text-sm font-medium hover:bg-neutral-900 transition-all">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                <Link href={`/buyer/create?from=${grail.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-800 text-neutral-400 text-sm font-medium hover:bg-neutral-900 transition-all">
                  <Copy className="w-3.5 h-3.5" /> Post Similar
                </Link>
                {(isOwner || isSeller) && (
                  <Link href="/disputes" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-all">
                    <AlertTriangle className="w-3.5 h-3.5" /> File Dispute
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Offers section */}
          <div>
            {/* Offer tabs */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-bold text-white">Offers <span className="text-neutral-500 font-normal text-sm">({grail._count.offers})</span></h2>
                {pendingOffers.length >= 2 && (
                  <div className="flex rounded-lg border border-neutral-800 overflow-hidden text-xs font-medium">
                    <button onClick={() => setActiveTab("all")} className={`px-3 py-1.5 transition-colors ${activeTab === "all" ? "bg-orange-500 text-white" : "text-neutral-400 hover:bg-neutral-900"}`}>All</button>
                    <button onClick={() => setActiveTab("compare")} className={`px-3 py-1.5 transition-colors ${activeTab === "compare" ? "bg-orange-500 text-white" : "text-neutral-400 hover:bg-neutral-900"}`}>Compare</button>
                  </div>
                )}
              </div>
              {isSeller && grail.status === "ACTIVE" && !showOfferForm && (
                <button onClick={() => setShowOfferForm(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 transition-colors">
                  <Package className="w-4 h-4" /> Make Offer
                </button>
              )}
            </div>

            {/* Offer form */}
            {showOfferForm && (
              <div className="bg-orange-500/10 border-2 border-orange-500/20 rounded-2xl p-5 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white">Submit Your Offer</h3>
                  <button onClick={() => setShowOfferForm(false)} className="text-neutral-500 hover:text-neutral-300"><X className="w-4 h-4" /></button>
                </div>
                {marketData && <div className="mb-4"><MarketPulse data={marketData} compact /></div>}
                <form onSubmit={submitOffer} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Your Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                      <input type="number" value={offerForm.price} onChange={(e) => setOfferForm((f) => ({ ...f, price: e.target.value }))} required min={1} placeholder="0" className="input-field pl-7" />
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">Buyer&apos;s budget: {formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Item Condition</label>
                    <select value={offerForm.condition} onChange={(e) => setOfferForm((f) => ({ ...f, condition: e.target.value }))} required className="input-field">
                      <option value="">Select condition...</option>
                      {CONDITIONS.filter((c) => c.value !== "any").map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description</label>
                    <textarea value={offerForm.description} onChange={(e) => setOfferForm((f) => ({ ...f, description: e.target.value }))} required minLength={10} rows={3} placeholder="Describe your item — grades, subs, provenance, shipping..." className="input-field resize-none" />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setShowOfferForm(false)} className="flex-1 px-4 py-2 rounded-lg border border-neutral-800 text-neutral-300 font-medium text-sm hover:bg-neutral-900 transition-colors">Cancel</button>
                    <button type="submit" disabled={submittingOffer} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 disabled:opacity-50 transition-colors">
                      {submittingOffer && <Loader2 className="w-4 h-4 animate-spin" />} Submit Offer
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Offer comparison view */}
            {activeTab === "compare" && pendingOffers.length >= 2 ? (
              <OfferComparison offers={grail.offers} budgetMin={grail.budgetMin} budgetMax={grail.budgetMax} isOwner={!!isOwner} onAccept={(oid) => handleOfferAction(oid, "ACCEPTED")} onDecline={(oid) => handleOfferAction(oid, "DECLINED")} actionLoading={actionLoading} />
            ) : (
              grail.offers.length === 0 ? (
                <div className="bg-neutral-900 rounded-xl border border-dashed border-neutral-800 p-8 text-center">
                  <Package className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No offers yet{isSeller ? " — be the first!" : ""}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {grail.offers.map((offer) => {
                    const offerImages = JSON.parse(offer.images) as string[]
                    const rating = offer.seller.ratingsReceived.length ? (offer.seller.ratingsReceived.reduce((s, r) => s + r.score, 0) / offer.seller.ratingsReceived.length).toFixed(1) : null
                    return (
                      <div key={offer.id} className={`bg-neutral-900 rounded-xl border-2 overflow-hidden ${offer.status === "ACCEPTED" ? "border-green-300" : "border-neutral-800"}`}>
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full overflow-hidden bg-orange-500/15 flex items-center justify-center font-bold text-orange-400 flex-shrink-0">
                                {offer.seller.image ? <img src={offer.seller.image} alt="" className="w-full h-full object-cover" /> : offer.seller.name?.[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <Link href={`/profile/${offer.seller.id}`} className="font-semibold text-white text-sm hover:text-orange-500">{offer.seller.name}</Link>
                                  {offer.seller.verifiedSeller && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-semibold"><ShieldCheck className="w-3 h-3" /> Verified</span>}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  {rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-orange-400" fill="currentColor" />{rating}</span>}
                                  <span>{offer.seller.successfulSales} sales</span>
                                  <span>·</span><span>{formatTimeAgo(offer.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-xl font-bold text-white">{formatCurrency(offer.price)}</div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${offer.status === "PENDING" ? "bg-orange-500/15 text-orange-400" : offer.status === "ACCEPTED" ? "bg-green-100 text-green-800" : offer.status === "DECLINED" ? "bg-red-100 text-red-800" : "bg-neutral-800 text-neutral-400"}`}>
                                {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
                              </span>
                            </div>
                          </div>

                          {offerImages.length > 0 && (
                            <div className="mt-3">
                              <ImageGallery images={offerImages} thumbnailClass="h-24" />
                            </div>
                          )}

                          <p className="text-sm text-neutral-400 mt-3 leading-relaxed">{offer.description}</p>
                          <div className="mt-2 text-xs text-neutral-500">Condition: <span className="font-medium text-neutral-300">{getConditionLabel(offer.condition)}</span></div>

                          {isOwner && offer.status === "PENDING" && grail.status === "ACTIVE" && (
                            <div className="flex gap-2 mt-4">
                              <button onClick={() => handleOfferAction(offer.id, "ACCEPTED")} disabled={actionLoading === offer.id} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white font-semibold text-sm hover:bg-green-600 disabled:opacity-50 transition-colors">
                                {actionLoading === offer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />} Accept
                              </button>
                              <button onClick={() => handleOfferAction(offer.id, "DECLINED")} disabled={actionLoading === offer.id} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 font-semibold text-sm hover:bg-red-50 disabled:opacity-50 transition-colors">
                                <X className="w-3.5 h-3.5" /> Decline
                              </button>
                              <Link href={`/messages/${offer.id}`} className="px-3 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-900 transition-colors">
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                            </div>
                          )}
                          {offer.status === "ACCEPTED" && (
                            <div className="mt-4 flex gap-2">
                              <Link href={`/checkout/${offer.id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-colors">
                                <CheckCircle className="w-4 h-4" /> Proceed to Payment
                              </Link>
                              <Link href={`/messages/${offer.id}`} className="px-3 py-2 rounded-lg border border-neutral-800 text-neutral-400 hover:bg-neutral-900">
                                <MessageSquare className="w-4 h-4" />
                              </Link>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">
          {/* Poster */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
            <h3 className="font-semibold text-white mb-4 text-sm">Posted by</h3>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-500/15 flex items-center justify-center font-bold text-orange-400 text-lg">
                {grail.user.image ? <img src={grail.user.image} alt="" className="w-full h-full object-cover" /> : grail.user.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <Link href={`/profile/${grail.user.id}`} className="font-semibold text-white hover:text-orange-500">{grail.user.name}</Link>
                {grail.user.verified && <div className="flex items-center gap-1 text-xs text-blue-600 mt-0.5"><ShieldCheck className="w-3 h-3" /> Verified Collector</div>}
                <div className="text-xs text-neutral-500 mt-0.5">{grail.user._count.grailRequests} requests · Joined {formatDate(grail.user.createdAt)}</div>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
            <h3 className="font-semibold text-white mb-4 text-sm">Request Details</h3>
            <dl className="space-y-3 text-sm">
              {[
                ["Category", getCategoryLabel(grail.category)],
                ["Condition", getConditionLabel(grail.condition)],
                ["Budget", `${formatCurrency(grail.budgetMin)}–${formatCurrency(grail.budgetMax)}`],
                ["Total Offers", grail._count.offers.toString()],
                ["Views", grail.views.toString()],
                ["Posted", formatDate(grail.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <dt className="text-neutral-500">{label}</dt>
                  <dd className="font-medium text-white text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Market Pulse */}
          {marketData && <MarketPulse data={marketData} />}

          {/* Safety */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                <strong>Stay safe:</strong> All transactions go through GrailMarket&apos;s secure escrow. Never share contact info or pay outside the platform.
              </p>
            </div>
          </div>

          {/* Sell CTA */}
          {isSeller && grail.status === "ACTIVE" && !showOfferForm && (
            <button onClick={() => setShowOfferForm(true)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-400 transition-colors">
              <Package className="w-4 h-4" /> Make an Offer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
