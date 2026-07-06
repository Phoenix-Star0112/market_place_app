"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Package, Plus, Trophy, Loader2, Trash2, Eye, EyeOff, Tag, X } from "lucide-react"
import { formatCurrency, CATEGORIES, CONDITIONS, getCategoryLabel, getConditionLabel } from "@/lib/utils"
import { useToast } from "@/components/Toast"

interface Item {
  id: string; title: string; description: string; category: string
  condition: string; price: number; images: string; available: boolean; createdAt: string
}

const EMPTY_FORM = { title: "", description: "", category: "", condition: "near-mint", price: "", imageUrl: "" }

export default function SellerInventoryPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { success, error: toastError } = useToast()
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return }
    if (status !== "authenticated") return
    load()
  }, [status])

  async function load() {
    const r = await fetch("/api/inventory")
    const d = await r.json()
    setItems(Array.isArray(d) ? d : [])
    setLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title, description: form.description,
        category: form.category, condition: form.condition,
        price: parseFloat(form.price),
        images: form.imageUrl ? [form.imageUrl] : [],
      }),
    })
    const data = await res.json()
    if (res.ok) {
      success("Item added!", "Your inventory item is now listed")
      setItems((prev) => [data, ...prev])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } else {
      toastError("Error", data.error || "Failed to add item")
    }
    setSaving(false)
  }

  async function toggleAvailable(item: Item) {
    setTogglingId(item.id)
    const res = await fetch(`/api/inventory/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: !item.available }),
    })
    if (res.ok) {
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, available: !i.available } : i))
      success(item.available ? "Marked as sold" : "Listed again", "")
    }
    setTogglingId(null)
  }

  async function deleteItem(id: string) {
    setDeletingId(id)
    const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" })
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i.id !== id))
      success("Removed", "Item removed from inventory")
    } else {
      toastError("Error", "Could not delete item")
    }
    setDeletingId(null)
  }

  if (status === "loading" || loading) {
    return <div className="py-16 page-container flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
  }

  const available = items.filter((i) => i.available).length
  const sold = items.filter((i) => !i.available).length

  return (
    <div className="py-8 page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-orange-500" /> My Inventory
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {available} available · {sold} sold
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 transition-colors"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cancel" : "Add Item"}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 mb-6">
          <h2 className="font-bold text-white mb-5">List a New Item</h2>
          <form onSubmit={handleAdd} className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Item Title *</label>
              <input type="text" required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. 2003 Topps Chrome LeBron James Rookie BGS 9.5" className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Category *</label>
              <select required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
                <option value="">Select...</option>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Condition *</label>
              <select required value={form.condition} onChange={(e) => setForm((f) => ({ ...f, condition: e.target.value }))} className="input-field">
                {CONDITIONS.filter((c) => c.value !== "any").map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Asking Price (USD) *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                <input type="number" required min={1} value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  placeholder="0" className="input-field pl-7" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Image URL (optional)</label>
              <input type="url" value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..." className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Description *</label>
              <textarea required minLength={10} rows={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe grades, subs, provenance, condition details..." className="input-field resize-none" />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-neutral-800 text-neutral-300 text-sm font-medium hover:bg-neutral-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 disabled:opacity-50 transition-colors">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Add to Inventory
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items grid */}
      {items.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-dashed border-neutral-800 p-16 text-center">
          <Package className="w-12 h-12 text-neutral-700 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-400 mb-1">No inventory items yet</h3>
          <p className="text-sm text-neutral-500 mb-5">List items you have available to offer to buyers</p>
          <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 transition-colors">
            <Plus className="w-4 h-4" /> Add First Item
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const images = JSON.parse(item.images) as string[]
            return (
              <div key={item.id} className={`bg-neutral-900 rounded-xl border overflow-hidden transition-all ${item.available ? "border-neutral-800" : "border-neutral-900 opacity-60"}`}>
                <div className="h-36 bg-neutral-800 overflow-hidden relative">
                  {images[0] ? (
                    <img src={images[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><Trophy className="w-8 h-8 text-neutral-700" /></div>
                  )}
                  {!item.available && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-sm font-bold bg-neutral-900/80 px-3 py-1 rounded-full">SOLD</span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-white text-sm line-clamp-1 mb-1">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                    <span className="px-1.5 py-0.5 rounded-full bg-neutral-800">{getCategoryLabel(item.category)}</span>
                    <span>{getConditionLabel(item.condition)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-500 text-lg">{formatCurrency(item.price)}</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => toggleAvailable(item)}
                        disabled={togglingId === item.id}
                        className={`p-1.5 rounded-lg transition-colors ${item.available ? "text-green-600 hover:bg-green-900/20" : "text-neutral-500 hover:bg-neutral-800"}`}
                        title={item.available ? "Mark as sold" : "List again"}
                      >
                        {togglingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : item.available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-900/20 transition-colors"
                      >
                        {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
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
