"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import {
  Trophy, Bell, ChevronDown, Menu, X, User, LayoutDashboard,
  LogOut, Package,
} from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

const POLL_INTERVAL_MS = 30_000

export function Navigation() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [newNotifArrived, setNewNotifArrived] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const prevUnreadRef = useRef(0)

  const fetchNotifications = () => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((d) => {
        const incoming: Notification[] = d.notifications || []
        const count: number = d.unreadCount || 0
        setNotifications(incoming)
        setUnreadCount(count)
        // Trigger pulse if unread count grew since last fetch
        if (count > prevUnreadRef.current) {
          setNewNotifArrived(true)
        }
        prevUnreadRef.current = count
      })
      .catch(() => {})
  }

  // Initial fetch + polling
  useEffect(() => {
    if (!session) return
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [session])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const handleOpenNotif = () => {
    setNotifOpen((prev) => !prev)
    // Auto-dismiss pulse when panel is opened
    if (!notifOpen) {
      setNewNotifArrived(false)
    }
  }

  const handleMarkAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" })
    prevUnreadRef.current = 0
    setUnreadCount(0)
    setNewNotifArrived(false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-black/60 backdrop-blur-md border-b border-white/10">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:opacity-80 text-white">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-orange-500">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span>GrailMarket</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/grails" className="px-3 py-2 rounded-md text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/10">
              Browse
            </Link>
            <Link href="/trending" className="px-3 py-2 rounded-md text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/10 flex items-center gap-1">
              🔥 Trending
            </Link>
            <Link href="/how-it-works" className="px-3 py-2 rounded-md text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/10">
              How It Works
            </Link>
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleOpenNotif}
                    className={`relative p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 ${newNotifArrived ? "bell-pulse" : ""}`}
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-neutral-900 rounded-xl shadow-lg border border-neutral-800 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
                        <span className="font-semibold text-sm text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-orange-400 hover:text-orange-300 font-medium">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-neutral-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "#"}
                              onClick={() => setNotifOpen(false)}
                              className={`flex flex-col px-4 py-3 hover:bg-neutral-800 border-b border-neutral-800 last:border-0 ${!n.read ? "bg-orange-500/10" : ""}`}
                            >
                              <span className="text-sm font-medium text-white">{n.title}</span>
                              <span className="text-xs text-neutral-400 mt-0.5">{n.message}</span>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User menu */}
                <div className="relative" ref={userMenuRef}>
                  {/* Avatar — click opens dropdown, but direct link to profile on avatar itself */}
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-white/10"
                  >
                    <Link
                      href="/profile/me"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all bg-orange-500 text-white hover:ring-2 hover:ring-orange-500 hover:ring-offset-1 hover:ring-offset-black"
                    >
                      {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        session.user.name?.[0]?.toUpperCase() || "U"
                      )}
                    </Link>
                    <span className="text-sm font-medium max-w-24 truncate hidden sm:block text-white">
                      {session.user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-neutral-900 rounded-xl shadow-xl border border-neutral-800 overflow-hidden py-1 z-50">
                      <div className="px-4 py-3 border-b border-neutral-800 mb-1">
                        <p className="text-xs text-neutral-400">Signed in as</p>
                        <p className="text-sm font-semibold text-white truncate">{session.user.email}</p>
                        {(session.user.verified || session.user.verifiedSeller) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-400 mt-0.5">
                            ✓ {session.user.verifiedSeller ? "Verified Seller" : "Verified"}
                          </span>
                        )}
                      </div>
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
                        <LayoutDashboard className="w-4 h-4 text-neutral-400" /> Dashboard
                      </Link>
                      <Link href="/profile/me" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
                        <User className="w-4 h-4 text-neutral-400" /> My Profile
                      </Link>
                      <Link href="/buyer/saved" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
                        <Package className="w-4 h-4" /> Saved Watchlist
                      </Link>
                      <Link href="/transactions" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
                        <Package className="w-4 h-4" /> Transactions
                      </Link>
                      {(session.user.role === "SELLER" || session.user.verifiedSeller) && (
                        <Link href="/seller/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800">
                          <Package className="w-4 h-4" /> Seller Dashboard
                        </Link>
                      )}
                      <div className="border-t border-neutral-800 mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-400 hover:bg-red-900/20"
                        >
                          <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:bg-white/10 transition-colors">Sign In</Link>
                <Link href="/register" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold bg-orange-500 text-white hover:bg-orange-400 transition-colors">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-neutral-300 hover:bg-white/10"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-black/90 backdrop-blur-md">
          <div className="page-container py-3 flex flex-col gap-1">
            <Link href="/grails" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-neutral-200 hover:bg-white/10">Browse Grails</Link>
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-neutral-200 hover:bg-white/10">How It Works</Link>
            {session ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-neutral-200 hover:bg-white/10">Dashboard</Link>
                <Link href={`/profile/${session.user.id}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-neutral-200 hover:bg-white/10">My Profile</Link>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left px-3 py-2 rounded-md text-sm font-medium text-red-400 hover:bg-white/10">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-semibold text-white border border-white/20">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 text-center px-4 py-2 rounded-lg text-sm font-bold bg-orange-500 text-white">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
