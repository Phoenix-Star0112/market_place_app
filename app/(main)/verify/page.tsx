import Link from "next/link"
import { ShieldCheck, Star, CheckCircle, Clock, FileText, Camera, ArrowRight, Trophy, Package, Zap } from "lucide-react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

const BUYER_STEPS = [
  { icon: FileText, title: "Verify Email", desc: "Confirm your email address is valid and active.", done: true },
  { icon: Camera, title: "Profile Photo", desc: "Upload a clear photo to build trust with sellers.", done: false },
  { icon: Star, title: "Complete 3 Transactions", desc: "Build your transaction history on the platform.", done: false },
  { icon: ShieldCheck, title: "ID Verification", desc: "Submit government-issued ID via our secure verification partner.", done: false },
]

const SELLER_STEPS = [
  { icon: FileText, title: "Register as Seller", desc: "Switch to a Seller account in your profile settings.", done: true },
  { icon: Zap, title: "Connect Stripe", desc: "Link your Stripe account to receive payouts directly.", done: false },
  { icon: Camera, title: "Verification Photos", desc: "Submit photos of 3 recent items you've sold.", done: false },
  { icon: ShieldCheck, title: "Identity Check", desc: "Complete our identity verification to unlock the Verified Seller badge.", done: false },
  { icon: Star, title: "Achieve 10 Sales", desc: "Complete 10 transactions with a 4★+ average rating.", done: false },
]

const BENEFITS = [
  { icon: "🏆", title: "Verified Collector Badge", desc: "Stand out to sellers with a trusted badge on your profile and all requests." },
  { icon: "⚡", title: "Priority Matching", desc: "Verified buyers get their grails shown first to verified sellers." },
  { icon: "💰", title: "Reduced Disputes", desc: "Verified users have 94% fewer disputes than unverified users." },
  { icon: "🔓", title: "Higher Limits", desc: "Unlock higher transaction limits — up to $50,000 per transaction." },
]

export default async function VerifyPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="py-10 page-container max-w-4xl">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
          <ShieldCheck className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-3">Verification Center</h1>
        <p className="text-slate-500 max-w-xl mx-auto">
          Verified users buy and sell faster, with higher limits and fewer disputes.
          Build trust in the GrailMarket community.
        </p>
      </div>

      {/* Benefits */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {BENEFITS.map((b) => (
          <div key={b.title} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <div className="text-2xl mb-2">{b.icon}</div>
            <h3 className="font-semibold text-slate-900 text-sm mb-1">{b.title}</h3>
            <p className="text-xs text-slate-500 leading-relaxed">{b.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Buyer verification */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white">
            <div className="flex items-center gap-3">
              <Trophy className="w-6 h-6" />
              <div>
                <h2 className="font-bold text-lg">Verified Collector</h2>
                <p className="text-blue-100 text-sm">For serious buyers</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-4 mb-6">
              {BUYER_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-green-100" : "bg-slate-100"}`}>
                    {step.done
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <step.icon className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      {step.done && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">DONE</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {session ? (
              <Link href="/profile/edit" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
                Continue Verification <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link href="/register" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors">
                Create Account to Start <ArrowRight className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>

        {/* Seller verification */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 p-5 text-white">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6" />
              <div>
                <h2 className="font-bold text-lg">Verified Seller</h2>
                <p className="text-green-100 text-sm">For professional sellers</p>
              </div>
            </div>
          </div>
          <div className="p-5">
            <div className="space-y-4 mb-6">
              {SELLER_STEPS.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${step.done ? "bg-green-100" : "bg-slate-100"}`}>
                    {step.done
                      ? <CheckCircle className="w-4 h-4 text-green-600" />
                      : <step.icon className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                      {step.done && <span className="text-[10px] font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">DONE</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/seller/onboarding" className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 text-white font-semibold text-sm hover:bg-green-700 transition-colors">
              Start Seller Verification <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="mt-10 bg-slate-50 rounded-2xl border border-slate-200 p-6">
        <h3 className="font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { q: "How long does verification take?", a: "Email verification is instant. Full ID verification takes 1-3 business days." },
            { q: "Is my data secure?", a: "Yes — we use industry-standard encryption and never store your ID documents beyond verification." },
            { q: "What ID do you accept?", a: "Government-issued photo ID: passport, driver's license, or national ID card." },
            { q: "Can I lose my verification?", a: "Yes — violations of our terms (fraud, chargebacks, off-platform transactions) will result in badge removal." },
          ].map((item) => (
            <div key={item.q}>
              <p className="text-sm font-semibold text-slate-900 mb-1">{item.q}</p>
              <p className="text-sm text-slate-500">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
