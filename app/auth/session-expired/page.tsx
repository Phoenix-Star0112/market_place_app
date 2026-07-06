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
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 p-4">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-white mb-8">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          GrailMarket
        </Link>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-sm p-8">
          <div className="w-14 h-14 bg-orange-500/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🔄</span>
          </div>

          <h1 className="text-xl font-bold text-white mb-2">
            Session Expired
          </h1>
          <p className="text-neutral-500 text-sm leading-relaxed mb-6">
            Your session is outdated (this can happen after the database is reset).
            Signing you out and redirecting to login…
          </p>

          <div className="flex items-center justify-center gap-2 text-orange-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Redirecting to login…</span>
          </div>

          <div className="mt-6 pt-5 border-t border-neutral-800">
            <p className="text-xs text-neutral-500">
              Not redirecting?{" "}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-orange-500 hover:text-orange-400 font-medium underline"
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
