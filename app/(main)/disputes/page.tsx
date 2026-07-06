"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { AlertTriangle, ShieldCheck, Loader2, MessageSquare, CheckCircle } from "lucide-react"
import { useToast } from "@/components/Toast"

const REASONS = [
  { value: "item_not_as_described", label: "Item not as described" },
  { value: "item_not_received", label: "Item not received" },
  { value: "fraud", label: "Suspected fraud" },
  { value: "payment_issue", label: "Payment issue" },
  { value: "other", label: "Other" },
]

interface Offer {
  id: string
  price: number
  grailRequest: { title: string }
  seller: { name: string | null }
}

export default function DisputesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [offers, setOffers] = useState<Offer[]>([])
  const [form, setForm] = useState({ offerId: "", reason: "", description: "" })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status !== "authenticated") return
    // Fetch user's accepted/completed offers for dispute selection
    fetch("/api/offers?status=ACCEPTED")
      .then((r) => r.json())
      .then((d) => setOffers(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [status, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setSubmitted(true)
      success("Dispute Filed", data.message)
    } else {
      toastError("Error", data.error || "Failed to file dispute")
    }
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="py-16 page-container max-w-2xl">
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-10 text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Dispute Filed Successfully</h2>
          <p className="text-neutral-500 mb-6">Our team will review your case and respond within 24 hours. Check your messages for updates.</p>
          <Link href="/messages" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors">
            <MessageSquare className="w-4 h-4" /> Go to Messages
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-8 page-container max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-2">Dispute Resolution</h1>
      <p className="text-neutral-500 text-sm mb-8">
        If you have an issue with a transaction, file a dispute and our team will mediate within 24 hours.
      </p>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        {[
          { icon: "📋", title: "File Dispute", desc: "Submit details about your issue" },
          { icon: "🔍", title: "Review (24h)", desc: "Our team investigates the case" },
          { icon: "⚖️", title: "Resolution", desc: "Fair outcome for both parties" },
        ].map((s) => (
          <div key={s.title} className="bg-neutral-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="font-semibold text-white text-sm">{s.title}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Before filing a dispute:</strong> Try resolving the issue directly via the messaging system.
          Most issues are resolved faster through direct communication.
        </div>
      </div>

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6">
        <h2 className="font-bold text-white mb-5">File a Dispute</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Transaction / Offer</label>
            <select
              value={form.offerId}
              onChange={(e) => setForm((f) => ({ ...f, offerId: e.target.value }))}
              required
              className="input-field"
            >
              <option value="">Select a transaction...</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.grailRequest.title} — with {o.seller.name}
                </option>
              ))}
              <option value="other">Other (specify in description)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Reason for Dispute</label>
            <div className="grid sm:grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, reason: r.value }))}
                  className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                    form.reason === r.value
                      ? "border-orange-500 bg-orange-500/10 text-orange-400 font-medium"
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">Describe the Issue</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              required
              minLength={20}
              rows={4}
              placeholder="Provide as much detail as possible: what happened, when, any evidence you have..."
              className="input-field resize-none"
            />
          </div>

          <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              All disputes are reviewed fairly. Filing false disputes may result in account suspension.
              Your evidence and the other party&apos;s response will be reviewed.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !form.reason || !form.description}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Filing Dispute..." : "File Dispute"}
          </button>
        </form>
      </div>
    </div>
  )
}
