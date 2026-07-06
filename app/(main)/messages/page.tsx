"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MessageSquare, Package, Trophy, Loader2 } from "lucide-react"
import { formatTimeAgo } from "@/lib/utils"

interface Conversation {
  id: string
  offer: {
    id: string
    price: number
    status: string
    seller: { id: string; name: string | null; image: string | null }
    grailRequest: {
      id: string; title: string
      user: { id: string; name: string | null; image: string | null }
    }
  }
  messages: Array<{ id: string; content: string; createdAt: string }>
  _count: { messages: number }
  updatedAt: string
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === "loading") return          // Wait for session to hydrate
    if (status === "unauthenticated") { router.push("/login"); return }
    fetch("/api/messages")
      .then((r) => r.json())
      .then((data) => { setConversations(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status, router])

  if (status === "loading") {
    return (
      <div className="py-16 page-container flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    )
  }
  if (!session) return null

  return (
    <div className="py-8 page-container max-w-3xl">
      <h1 className="text-2xl font-bold text-white mb-6">Messages</h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="bg-neutral-900 rounded-xl border border-dashed border-neutral-800 p-16 text-center">
          <MessageSquare className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
          <h3 className="font-medium text-neutral-400 mb-1">No conversations yet</h3>
          <p className="text-sm text-neutral-500 mb-5">Messages with sellers/buyers will appear here</p>
          <Link href="/grails" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 text-white font-semibold text-sm hover:bg-orange-400 transition-colors">
            Browse Grails
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => {
            const isBuyer = session.user.id === conv.offer.grailRequest.user.id
            const otherUser = isBuyer ? conv.offer.seller : conv.offer.grailRequest.user
            const lastMessage = conv.messages[0]
            const unread = conv._count.messages

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 bg-neutral-900 rounded-xl border border-neutral-800 p-4 hover:shadow-sm hover:border-neutral-700 transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-orange-500/15 flex items-center justify-center font-bold text-orange-300 flex-shrink-0">
                  {otherUser.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-white text-sm">{otherUser.name}</span>
                    <span className="text-xs text-neutral-500 flex-shrink-0">
                      {formatTimeAgo(conv.updatedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 truncate mt-0.5">
                    re: {conv.offer.grailRequest.title}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-neutral-500 truncate mt-0.5">{lastMessage.content}</p>
                  )}
                </div>
                {unread > 0 && (
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {unread}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
