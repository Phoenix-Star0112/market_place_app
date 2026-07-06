"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"

const STAR_LABELS = ["", "😞 Terrible", "😕 Poor", "😐 Okay", "😊 Good", "🤩 Amazing"]

interface OfferSummary {
  id: string
  price: number
  grailRequestTitle: string
  sellerName?: string
  buyerName?: string
}

interface Props {
  offer: OfferSummary
  role: "buyer" | "seller"
  recipientId: string
  recipientName: string
  onClose: () => void
  onSubmit: () => void
}

export function RatingModal({ offer, role, recipientId, recipientName, onClose, onSubmit }: Props) {
  const [hovered, setHovered] = useState(0)
  const [selected, setSelected] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const { success, error: toastError } = useToast()

  async function handleSubmit() {
    if (!selected) return
    setLoading(true)
    const res = await fetch("/api/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: selected,
        comment: comment || undefined,
        receiverId: recipientId,
        offerId: offer.id,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      success("Review submitted!", `Your ${selected}-star review was saved`)
      onSubmit()
    } else {
      toastError("Error", data.error || "Could not submit review")
    }
    setLoading(false)
  }

  const display = hovered || selected

  return (
    <div
      className="fixed inset-0 z-[9998] bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-white">Leave a Review</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-neutral-800 rounded-xl p-4 mb-5">
          <p className="text-xs text-neutral-500 mb-0.5">
            {role === "buyer" ? "You purchased from" : "You sold to"} · ${offer.price.toFixed(0)}
          </p>
          <p className="text-sm font-medium text-white line-clamp-1 mb-1">
            {offer.grailRequestTitle}
          </p>
          <p className="text-sm text-neutral-400">
            Rating <span className="font-semibold text-white">{recipientName}</span>
          </p>
        </div>

        {/* Stars */}
        <div className="flex flex-col items-center mb-5">
          <div className="flex gap-2 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setSelected(n)}
                className={`text-4xl transition-transform hover:scale-110 ${
                  n <= display ? "text-orange-400" : "text-neutral-700"
                }`}
              >
                ★
              </button>
            ))}
          </div>
          <p className={`text-sm font-semibold h-5 transition-all ${display ? "text-neutral-300 opacity-100" : "opacity-0"}`}>
            {STAR_LABELS[display]}
          </p>
        </div>

        {/* Comment */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-neutral-300 mb-1.5">
            Comment <span className="text-neutral-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 500))}
            rows={3}
            placeholder="Share your experience with this collector..."
            className="input-field resize-none"
          />
          <p className="text-xs text-neutral-500 mt-1 text-right">{comment.length}/500</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-neutral-700 text-neutral-300 font-medium text-sm hover:bg-neutral-800 transition-colors"
          >
            Skip for Now
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Submit Review
          </button>
        </div>
      </div>
    </div>
  )
}
