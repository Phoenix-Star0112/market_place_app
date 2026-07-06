import Link from "next/link"
import { Trophy, ExternalLink } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-neutral-950 text-neutral-400 border-t border-neutral-800">
      <div className="page-container py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
              <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              GrailMarket
            </Link>
            <p className="mt-3 text-sm text-neutral-500 leading-relaxed">
              Don&apos;t Search. Be Found.<br />
              The premier marketplace for serious collectors.
            </p>
            <div className="flex gap-3 mt-4">
              <a href="#" className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/grails" className="hover:text-white transition-colors">Browse Grails</Link></li>
              <li><Link href="/buyer/create" className="hover:text-white transition-colors">Post a Grail</Link></li>
              <li><Link href="/seller/dashboard" className="hover:text-white transition-colors">Sell Items</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/grails?category=sports-cards-mlb" className="hover:text-white transition-colors">MLB Cards</Link></li>
              <li><Link href="/grails?category=sports-cards-nba" className="hover:text-white transition-colors">NBA Cards</Link></li>
              <li><Link href="/grails?category=pokemon" className="hover:text-white transition-colors">Pokémon</Link></li>
              <li><Link href="/grails?category=autographs" className="hover:text-white transition-colors">Autographs</Link></li>
              <li><Link href="/grails?category=sports-memorabilia" className="hover:text-white transition-colors">Memorabilia</Link></li>
            </ul>
          </div>

          {/* Trust & Company */}
          <div>
            <h4 className="font-semibold text-white text-sm mb-3">Trust & Safety</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/verify" className="hover:text-white transition-colors">Verification Center</Link></li>
              <li><Link href="/trust" className="hover:text-white transition-colors">Buyer Protection</Link></li>
              <li><Link href="/disputes" className="hover:text-white transition-colors">Dispute Resolution</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-neutral-500">
            © {new Date().getFullYear()} GrailMarket, Inc. All rights reserved.
          </p>
          <p className="text-xs text-neutral-500">
            Payments secured by{" "}
            <span className="text-neutral-400 font-medium">Stripe Connect</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
