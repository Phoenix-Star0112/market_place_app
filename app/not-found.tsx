import Link from "next/link"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />

      <main className="flex-1 flex items-center justify-center py-24 px-4 pt-16 bg-neutral-950">
        <div className="text-center max-w-lg w-full">

          {/* Big trophy + 404 */}
          <div className="relative inline-block mb-8">
            <div className="text-[120px] font-black leading-none text-neutral-900 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L13.09 8.26L19 7L15.45 11.45L19 16L13.09 15.74L12 22L10.91 15.74L5 16L8.55 11.45L5 7L10.91 8.26L12 2Z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Copy */}
          <h1 className="text-2xl font-bold text-white mb-3">
            This Grail Doesn&apos;t Exist
          </h1>
          <p className="text-neutral-400 leading-relaxed mb-8 max-w-sm mx-auto">
            The page you&apos;re looking for has gone the way of a PSA 10 Honus Wagner —
            incredibly rare and probably imaginary. Let&apos;s get you back on the hunt.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 justify-center mb-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors shadow-sm"
            >
              ← Go Home
            </Link>
            <Link
              href="/grails"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 font-semibold hover:bg-neutral-900 transition-colors"
            >
              Browse Grails
            </Link>
            <Link
              href="/buyer/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-neutral-800 text-neutral-300 font-semibold hover:bg-neutral-900 transition-colors"
            >
              Post a Grail
            </Link>
          </div>

          {/* Popular categories */}
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-4">
              Popular Categories
            </p>
            <div className="grid grid-cols-4 gap-3">
              {[
                { emoji: "🏀", label: "NBA", href: "/grails?category=sports-cards-nba" },
                { emoji: "⚾", label: "MLB", href: "/grails?category=sports-cards-mlb" },
                { emoji: "⚡", label: "Pokémon", href: "/grails?category=pokemon" },
                { emoji: "🏈", label: "NFL", href: "/grails?category=sports-cards-nfl" },
              ].map((c) => (
                <Link
                  key={c.label}
                  href={c.href}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-orange-500/10 hover:border-orange-500/20 border border-transparent transition-all"
                >
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-medium text-neutral-400">{c.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  )
}
