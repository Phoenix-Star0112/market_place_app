"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { ArrowLeft, Send, Loader2, AlertTriangle, ShieldCheck } from "lucide-react"
import { formatCurrency, formatTimeAgo } from "@/lib/utils"

interface Message {
  id: string
  content: string
  senderId: string
  sender: { id: string; name: string | null; image: string | null }
  createdAt: string
  read: boolean
}

interface ConvDetails {
  id: string
  offer: {
    id: string; price: number; status: string
    seller: { id: string; name: string | null; verifiedSeller: boolean }
    grailRequest: { id: string; title: string; user: { id: string; name: string | null } }
  }
}

export default function ConversationPage() {
  const { id } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [conv, setConv] = useState<ConvDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [warning, setWarning] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") { router.push("/login"); return }
    loadMessages()
  }, [status, id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function loadMessages() {
    const [msgRes, convRes] = await Promise.all([
      fetch(`/api/messages?conversationId=${id}`),
      fetch(`/api/messages`),
    ])
    const msgs = await msgRes.json()
    const convs = await convRes.json()
    setMessages(Array.isArray(msgs) ? msgs : [])
    const found = convs.find ? convs.find((c: ConvDetails) => c.id === id) : null
    setConv(found)
    setLoading(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setSending(true)
    setWarning("")

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: id, content: input.trim() }),
    })

    const data = await res.json()
    if (!res.ok) {
      setWarning(data.error || "Failed to send")
      setSending(false)
      return
    }

    if (data.wasModified) {
      setWarning("Some contact information was removed from your message to keep conversations on-platform.")
    }

    setMessages((prev) => [...prev, data])
    setInput("")
    setSending(false)
  }

  if (status === "loading") return <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-yellow-500" /></div>
  if (!session) return null

  return (
    <div className="py-6 page-container max-w-3xl">
      <Link href="/messages" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Messages
      </Link>

      {conv && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex items-center gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {conv.offer.grailRequest.title}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Offer: {formatCurrency(conv.offer.price)} ·{" "}
              <span className={`font-medium ${
                conv.offer.status === "ACCEPTED" ? "text-green-700" :
                conv.offer.status === "PENDING" ? "text-yellow-700" : "text-slate-600"
              }`}>
                {conv.offer.status.charAt(0) + conv.offer.status.slice(1).toLowerCase()}
              </span>
            </p>
          </div>
          <Link
            href={`/grails/${conv.offer.grailRequest.id}`}
            className="ml-auto text-xs font-medium text-yellow-600 hover:text-yellow-700"
          >
            View Grail →
          </Link>
        </div>
      )}

      {/* Off-platform warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          For your protection, sharing contact info, emails, or external links is not allowed.
          Complete all transactions through GrailMarket&apos;s secure platform.
        </p>
      </div>

      {warning && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800">{warning}</p>
        </div>
      )}

      {/* Messages */}
      <div className="bg-white rounded-xl border border-slate-200 mb-4 overflow-hidden">
        <div className="h-[50vh] overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-yellow-500" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-sm text-slate-400">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === session.user.id
              return (
                <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? "bg-yellow-400 text-yellow-900 rounded-br-md"
                      : "bg-slate-100 text-slate-800 rounded-bl-md"
                  }`}>
                    {!isMe && (
                      <p className="text-xs font-semibold mb-1 opacity-70">{msg.sender.name}</p>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <p className={`text-[10px] mt-1 opacity-60 ${isMe ? "text-right" : ""}`}>
                      {formatTimeAgo(msg.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2 p-3 border-t border-slate-100">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="w-9 h-9 rounded-full bg-yellow-400 text-yellow-900 flex items-center justify-center hover:bg-yellow-300 disabled:opacity-40 transition-colors flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
