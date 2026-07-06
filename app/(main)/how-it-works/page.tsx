import Link from "next/link"
import { Search, Package, ShieldCheck, Star, DollarSign, CheckCircle, ArrowRight } from "lucide-react"

export default function HowItWorksPage() {
  return (
    <div className="py-16 page-container max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">How GrailMarket Works</h1>
        <p className="text-lg text-slate-500">
          The smarter way to buy and sell rare collectibles
        </p>
      </div>

      {/* For Buyers */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
          For Buyers
        </h2>
        <div className="space-y-4">
          {[
            { icon: Search, step: "1", title: "Post Your Grail", desc: "Describe the exact item you want — player, year, card number, grade, condition. Set your budget range and upload reference photos." },
            { icon: Package, step: "2", title: "Receive Seller Offers", desc: "Verified sellers browsing grail requests will find yours and submit offers with item photos, condition details, and their price." },
            { icon: Star, step: "3", title: "Review & Accept", desc: "Compare offers side by side. Message sellers for more details. Accept the best offer when you're ready." },
            { icon: ShieldCheck, step: "4", title: "Pay Securely", desc: "Payment is processed through Stripe's secure platform and held in escrow. Funds are only released when you confirm receipt." },
            { icon: CheckCircle, step: "5", title: "Rate Your Seller", desc: "After completing the transaction, leave a rating. Your feedback helps build the community's trust." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 border-2 border-yellow-200 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-xs text-yellow-600 font-bold tracking-widest mb-1">STEP {item.step}</div>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* For Sellers */}
      <section className="mb-14">
        <h2 className="text-2xl font-bold text-slate-900 mb-6 pb-3 border-b border-slate-200">
          For Sellers
        </h2>
        <div className="space-y-4">
          {[
            { icon: Search, step: "1", title: "Browse Grail Requests", desc: "Browse thousands of active buyer requests filtered by category, budget, and condition." },
            { icon: Package, step: "2", title: "Submit Your Offer", desc: "When you have an item that matches, submit a detailed offer with photos, condition info, and your price." },
            { icon: CheckCircle, step: "3", title: "Negotiate & Close", desc: "Message the buyer, answer questions, and agree on details. Once they accept, payment is initiated." },
            { icon: DollarSign, step: "4", title: "Get Paid", desc: "After the buyer confirms receipt, funds are released to your Stripe account. GrailMarket keeps 9% as a platform fee." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 bg-white rounded-xl border border-slate-200 p-5">
              <div className="w-10 h-10 rounded-xl bg-green-50 border-2 border-green-200 flex items-center justify-center flex-shrink-0">
                <item.icon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-xs text-green-600 font-bold tracking-widest mb-1">STEP {item.step}</div>
                <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-slate-900 rounded-2xl p-8 text-center text-white">
        <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
        <p className="text-slate-400 mb-6">Join thousands of collectors on GrailMarket today</p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-yellow-400 text-slate-900 font-semibold hover:bg-yellow-300 transition-colors">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/grails" className="inline-flex items-center px-6 py-3 rounded-lg border border-slate-600 text-white font-semibold hover:bg-slate-800 transition-colors">
            Browse Requests
          </Link>
        </div>
      </div>
    </div>
  )
}
