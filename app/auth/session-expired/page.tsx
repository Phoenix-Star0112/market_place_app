"use client"

import { useEffect } from "react"
import { signOut } from "next-auth/react"
import { Trophy, Loader2 } from "lucide-react"
import Link from "next/link"

export default function SessionExpiredPage() {
  // Auto sign-out the stale session on mount
  useEffect(() => {
    signOut({ callbackUrl: "/login", redirect: true })
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-slate-100 mb-8">
          <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-900" />
          </div>
          GrailMarket
        </Link>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔄</span>
          </div>

          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Session Expired
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
            Your session is outdated (this can happen after the database is reset).
            Signing you out and redirecting to login…
          </p>

          <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Redirecting to login…</span>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Not redirecting?{" "}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-yellow-600 hover:text-yellow-700 font-medium underline"
              >
                Click here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
