"use client"

import { useState } from "react"
import { X, DollarSign, MessageSquare, TrendingUp } from "lucide-react"

interface Seller {
  id: string
  name?: string | null
}

interface Offer {
  id: string
  price: number
  counterPrice?: number | null
  condition: string
  seller: Seller
}

interface GrailBudget {
  min: number
  max: number
}

interface CounterOfferModalProps {
  offer: Offer
  grailBudget: GrailBudget
  onClose: () => void
  onSubmit: (counterPrice: number, note: string) => Promise<void>
}

export function CounterOfferModal({ offer, grailBudget, onClose, onSubmit }: CounterOfferModalProps) {
  const [counterPrice, setCounterPrice] = useState<string>(
    offer.counterPrice ? String(offer.counterPrice) : String(offer.price)
  )
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)
  const [priceError, setPriceError] = useState("")

  const parsedPrice = parseFloat(counterPrice)
  const isValidPrice = !isNaN(parsedPrice) && parsedPrice > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPriceError("")

    if (!isValidPrice) {
      setPriceError("Please enter a valid counter price.")
      return
    }
    if (note.trim().length === 0) {
      return
    }

    setLoading(true)
    try {
      await onSubmit(parsedPrice, note.trim())
    } finally {
      setLoading(false)
    }
  }

  const budgetMidpoint = (grailBudget.min + grailBudget.max) / 2

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl"
        style={{ maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Make a Counter-Offer</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5">
          {/* Offer context */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Buyer&apos;s offer</span>
              <span className="font-semibold text-slate-900">${offer.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Buyer&apos;s budget range
              </span>
              <span className="font-medium text-slate-700">
                ${grailBudget.min.toFixed(0)} – ${grailBudget.max.toFixed(0)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Budget midpoint</span>
              <span className="font-medium text-yellow-700">${budgetMidpoint.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Condition</span>
              <span className="font-medium text-slate-700">{offer.condition}</span>
            </div>
          </div>

          {/* Counter price input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="counter-price" className="text-sm font-medium text-slate-700">
              Your Counter Price
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <DollarSign className="w-4 h-4" />
              </span>
              <input
                id="counter-price"
                type="number"
                min="0.01"
                step="0.01"
                value={counterPrice}
                onChange={(e) => {
                  setCounterPrice(e.target.value)
                  setPriceError("")
                }}
                className="input-field pl-9"
                placeholder="0.00"
                required
              />
            </div>
            {priceError && (
              <p className="text-xs text-red-600">{priceError}</p>
            )}
            {isValidPrice && parsedPrice > grailBudget.max && (
              <p className="text-xs text-amber-600">
                This price is above the buyer&apos;s stated maximum budget.
              </p>
            )}
            {isValidPrice && parsedPrice >= grailBudget.min && parsedPrice <= grailBudget.max && (
              <p className="text-xs text-green-600">
                This price is within the buyer&apos;s budget range.
              </p>
            )}
          </div>

          {/* Note / explanation */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="counter-note" className="text-sm font-medium text-slate-700 flex items-center gap-1">
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Explanation
            </label>
            <textarea
              id="counter-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="input-field resize-none"
              placeholder="Explain your counter price to the buyer…"
              required
              maxLength={500}
            />
            <p className="text-xs text-slate-400 text-right">{note.length}/500</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValidPrice || note.trim().length === 0}
              className="btn-primary flex-1"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"
                  />
                  Sending…
                </span>
              ) : (
                "Send Counter-Offer"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
