"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ArrowLeft, Trophy, Loader2, Info, X } from "lucide-react"
import { CATEGORIES, CONDITIONS } from "@/lib/utils"

function CreateGrailForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromId = searchParams.get("from")
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [prefillBanner, setPrefillBanner] = useState(!!fromId)
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    condition: "any",
    budgetMin: "",
    budgetMax: "",
  })

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/buyer/create")
    }
  }, [status, router])

  useEffect(() => {
    if (!fromId) return
    fetch(`/api/grails/${fromId}`)
      .then(r => r.json())
      .then(data => {
        if (data.id) {
          setForm(prev => ({
            ...prev,
            title: `Similar: ${data.title}`,
            category: data.category || prev.category,
            condition: data.condition || prev.condition,
            budgetMin: data.budgetMin?.toString() || prev.budgetMin,
            budgetMax: data.budgetMax?.toString() || prev.budgetMax,
            description: "",
          }))
        }
      })
      .catch(() => {})
  }, [fromId])

  if (status === "loading" || !session) {
    return (
      <div className="py-16 page-container flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const min = parseFloat(form.budgetMin)
    const max = parseFloat(form.budgetMax)
    if (isNaN(min) || isNaN(max) || min > max) {
      setError("Please enter a valid budget range")
      return
    }
    setLoading(true)
    setError("")

    const res = await fetch("/api/grails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description,
        category: form.category,
        condition: form.condition,
        budgetMin: min,
        budgetMax: max,
        images: [],
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error || "Failed to create grail request")
      setLoading(false)
      return
    }

    router.push(`/grails/${data.id}`)
  }

  return (
    <div className="py-8 page-container max-w-2xl">
      <Link href="/buyer/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Post a Grail Request</h1>
        <p className="text-slate-500 text-sm mt-1">
          Describe exactly what you&apos;re looking for and let sellers come to you
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex gap-3">
        <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-800">
          <strong>Pro tip:</strong> Be as specific as possible — include player names, card years, grades,
          and any other details. Better descriptions attract better offers.
        </div>
      </div>

      {prefillBanner && (
        <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm flex items-center justify-between">
          <span>Pre-filled from a similar grail — adjust as needed.</span>
          <button onClick={() => setPrefillBanner(false)} className="ml-2 text-blue-500 hover:text-blue-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Request Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            minLength={3}
            maxLength={100}
            placeholder="e.g. 2003 Topps Chrome LeBron James Refractor RC PSA 10"
            className="input-field"
          />
          <p className="text-xs text-slate-400 mt-1">{form.title.length}/100</p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            placeholder="Provide as much detail as possible: specific year, manufacturer, card number, player, team, graded or raw, serial numbered, etc."
            className="input-field resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">{form.description.length}/2000</p>
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Category <span className="text-red-400">*</span>
          </label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            required
            className="input-field"
          >
            <option value="">Select a category...</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Acceptable Condition <span className="text-red-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {CONDITIONS.map((cond) => (
              <button
                key={cond.value}
                type="button"
                onClick={() => update("condition", cond.value)}
                className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                  form.condition === cond.value
                    ? "border-yellow-400 bg-yellow-50 text-yellow-900 font-medium"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {cond.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Budget Range (USD) <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={form.budgetMin}
                onChange={(e) => update("budgetMin", e.target.value)}
                required
                min={1}
                placeholder="Min"
                className="input-field pl-7"
              />
            </div>
            <span className="text-slate-400">–</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
              <input
                type="number"
                value={form.budgetMax}
                onChange={(e) => update("budgetMax", e.target.value)}
                required
                min={1}
                placeholder="Max"
                className="input-field pl-7"
              />
            </div>
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <Link href="/buyer/dashboard" className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-slate-900 font-semibold hover:bg-yellow-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Posting..." : "Post Grail Request"}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function CreateGrailPage() {
  return (
    <Suspense fallback={<div className="py-16 page-container flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>}>
      <CreateGrailForm />
    </Suspense>
  )
}
