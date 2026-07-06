"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import {
  Trophy, Bell, ChevronDown, Menu, X, User, LayoutDashboard,
  LogOut, Settings, Package, Star, ShieldCheck,
} from "lucide-react"
import { DarkModeToggle } from "@/components/DarkModeToggle"

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
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-slate-100 hover:opacity-80">
            <div className="w-8 h-8 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-900" />
            </div>
            <span>GrailMarket</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/grails" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
              Browse
            </Link>
            <Link href="/trending" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1">
              🔥 Trending
            </Link>
            <Link href="/how-it-works" className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800">
              How It Works
            </Link>
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-3">
            {/* Dark mode toggle — always visible */}
            <DarkModeToggle />

            {session ? (
              <>
                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={handleOpenNotif}
                    className={`relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 ${newNotifArrived ? "bell-pulse" : ""}`}
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
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                        {unreadCount > 0 && (
                          <button onClick={handleMarkAllRead} className="text-xs text-yellow-600 hover:text-yellow-700 font-medium">
                            Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-72 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <Link
                              key={n.id}
                              href={n.link || "#"}
                              onClick={() => setNotifOpen(false)}
                              className={`flex flex-col px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 border-b border-slate-50 dark:border-slate-700 last:border-0 ${!n.read ? "bg-yellow-50 dark:bg-yellow-900/20" : ""}`}
                            >
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{n.title}</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</span>
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
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Link
                      href="/profile/me"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 rounded-full overflow-hidden bg-yellow-400 flex items-center justify-center text-sm font-bold text-yellow-900 flex-shrink-0 hover:ring-2 hover:ring-yellow-400 hover:ring-offset-1 transition-all"
                    >
                      {session.user.image ? (
                        <img src={session.user.image} alt={session.user.name || ""} className="w-full h-full object-cover" />
                      ) : (
                        session.user.name?.[0]?.toUpperCase() || "U"
                      )}
                    </Link>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-24 truncate hidden sm:block">
                      {session.user.name}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1 z-50">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 mb-1">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{session.user.email}</p>
                        {(session.user.verified || session.user.verifiedSeller) && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 mt-0.5">
                            ✓ {session.user.verifiedSeller ? "Verified Seller" : "Verified"}
                          </span>
                        )}
                      </div>
                      <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                      </Link>
                      <Link href="/profile/me" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <User className="w-4 h-4 text-slate-400" /> My Profile
                      </Link>
                      <Link href="/buyer/saved" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <Package className="w-4 h-4" /> Saved Watchlist
                      </Link>
                      <Link href="/transactions" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <Package className="w-4 h-4" /> Transactions
                      </Link>
                      {(session.user.role === "SELLER" || session.user.verifiedSeller) && (
                        <Link href="/seller/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <Package className="w-4 h-4" /> Seller Dashboard
                        </Link>
                      )}
                      <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                        <button
                          onClick={() => signOut({ callbackUrl: "/" })}
                          className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                <Link href="/login" className="btn-secondary">Sign In</Link>
                <Link href="/register" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="page-container py-3 flex flex-col gap-1">
            <Link href="/grails" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Browse Grails</Link>
            <Link href="/how-it-works" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">How It Works</Link>
            {session ? (
              <>
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">Dashboard</Link>
                <Link href={`/profile/${session.user.id}`} onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">My Profile</Link>
                <div className="flex items-center gap-2 px-3 py-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Dark Mode</span>
                  <DarkModeToggle />
                </div>
                <button onClick={() => signOut({ callbackUrl: "/" })} className="text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 text-center">Sign In</Link>
                <Link href="/register" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-center">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
