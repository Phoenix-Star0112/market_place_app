"use client"

import { useState } from "react"
import { Star, ShieldCheck, CheckCircle, X, TrendingUp, Package, ArrowUpDown } from "lucide-react"
import { formatCurrency, getConditionLabel } from "@/lib/utils"
import { ImageGallery } from "./ImageGallery"
import Link from "next/link"

interface Offer {
  id: string
  price: number
  description: string
  condition: string
  images: string
  status: string
  createdAt: string
  seller: {
    id: string
    name: string | null
    image: string | null
    verified: boolean
    verifiedSeller: boolean
    successfulSales: number
    ratingsReceived: Array<{ score: number }>
  }
}

interface Props {
  offers: Offer[]
  budgetMin: number
  budgetMax: number
  isOwner: boolean
  onAccept: (offerId: string) => void
  onDecline: (offerId: string) => void
  actionLoading: string | null
}

function SellerRating(r: Offer["seller"]["ratingsReceived"]) {
  if (!r.length) return null
  return (r.reduce((s, x) => s + x.score, 0) / r.length).toFixed(1)
}

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-2 text-xs">
      <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%`, transition: "width 0.5s ease" }} />
      </div>
      <span className="text-neutral-500 w-7 text-right">{value}</span>
    </div>
  )
}

export function OfferComparison({ offers, budgetMin, budgetMax, isOwner, onAccept, onDecline, actionLoading }: Props) {
  const [sortBy, setSortBy] = useState<"price" | "rating" | "sales">("price")
  const active = offers.filter((o) => o.status === "PENDING")

  const sorted = [...active].sort((a, b) => {
    if (sortBy === "price") return a.price - b.price
    if (sortBy === "rating") {
      const ra = a.seller.ratingsReceived.length ? a.seller.ratingsReceived.reduce((s, r) => s + r.score, 0) / a.seller.ratingsReceived.length : 0
      const rb = b.seller.ratingsReceived.length ? b.seller.ratingsReceived.reduce((s, r) => s + r.score, 0) / b.seller.ratingsReceived.length : 0
      return rb - ra
    }
    return b.seller.successfulSales - a.seller.successfulSales
  })

  if (active.length === 0) return null

  const maxPrice = Math.max(...active.map((o) => o.price))
  const maxSales = Math.max(...active.map((o) => o.seller.successfulSales), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white text-sm">
          Compare {active.length} Offer{active.length > 1 ? "s" : ""}
        </h3>
        <div className="flex items-center gap-1.5 text-xs">
          <ArrowUpDown className="w-3.5 h-3.5 text-neutral-500" />
          {(["price", "rating", "sales"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2.5 py-1 rounded-full font-medium capitalize transition-all ${
                sortBy === s ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className={`grid gap-4 ${sorted.length >= 3 ? "lg:grid-cols-3" : sorted.length === 2 ? "lg:grid-cols-2" : ""}`}>
        {sorted.map((offer, i) => {
          const rating = SellerRating(offer.seller.ratingsReceived)
          const images = JSON.parse(offer.images) as string[]
          const withinBudget = offer.price <= budgetMax
          const isBestPrice = offer.price === Math.min(...active.map((o) => o.price))
          const isTopSeller = offer.seller.successfulSales === Math.max(...active.map((o) => o.seller.successfulSales))

          return (
            <div
              key={offer.id}
              className={`rounded-xl border-2 overflow-hidden transition-all ${
                i === 0 && sortBy === "price" ? "border-orange-500 shadow-md" : "border-neutral-800"
              }`}
            >
              {/* Rank badge */}
              {i === 0 && (
                <div className="bg-orange-500 text-white text-[10px] font-bold py-1 text-center tracking-wider">
                  {sortBy === "price" ? "LOWEST PRICE" : sortBy === "rating" ? "TOP RATED" : "MOST EXPERIENCED"}
                </div>
              )}

              <div className="p-4">
                {/* Seller header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-full bg-orange-500/15 flex items-center justify-center font-bold text-orange-400 text-sm flex-shrink-0 overflow-hidden">
                    {offer.seller.image ? (
                      <img src={offer.seller.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      offer.seller.name?.[0]?.toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/profile/${offer.seller.id}`} className="font-semibold text-white text-sm hover:text-orange-400 truncate block">
                      {offer.seller.name}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                      {rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-orange-400" fill="currentColor" />{rating}</span>}
                      <span>{offer.seller.successfulSales} sales</span>
                      {offer.seller.verifiedSeller && <ShieldCheck className="w-3 h-3 text-blue-500" />}
                    </div>
                  </div>
                </div>

                {/* Image */}
                {images.length > 0 && (
                  <div className="h-28 rounded-lg overflow-hidden mb-3 bg-neutral-800">
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-2xl font-extrabold text-white">{formatCurrency(offer.price)}</span>
                  {isBestPrice && active.length > 1 && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">BEST</span>
                  )}
                </div>
                <p className={`text-[11px] mb-3 font-medium ${withinBudget ? "text-green-600" : "text-red-500"}`}>
                  {withinBudget ? `${formatCurrency(budgetMax - offer.price)} under max budget` : `${formatCurrency(offer.price - budgetMax)} over budget`}
                </p>

                {/* Condition */}
                <div className="text-xs text-neutral-400 mb-3">
                  <span className="font-medium">Condition:</span> {getConditionLabel(offer.condition)}
                </div>

                {/* Mini score bars */}
                <div className="space-y-1.5 mb-3">
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">Price vs budget</div>
                  <ScoreBar value={Math.max(0, maxPrice - offer.price)} max={maxPrice} color="bg-green-400" />
                  <div className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider mt-1">Seller experience</div>
                  <ScoreBar value={offer.seller.successfulSales} max={maxSales} color="bg-blue-400" />
                </div>

                <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3 mb-4">{offer.description}</p>

                {/* Actions */}
                {isOwner && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAccept(offer.id)}
                      disabled={actionLoading === offer.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg bg-green-500 text-white text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => onDecline(offer.id)}
                      disabled={actionLoading === offer.id}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
