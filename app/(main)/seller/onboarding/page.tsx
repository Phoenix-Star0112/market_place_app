"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { CheckCircle, ExternalLink, DollarSign, Zap, ShieldCheck, ArrowRight, Loader2 } from "lucide-react"
import { useToast } from "@/components/Toast"

const STEPS = [
  { id: 1, title: "Create Stripe Account", desc: "Set up your express payout account to receive funds." },
  { id: 2, title: "Verify Identity",       desc: "Stripe will verify your identity for compliance." },
  { id: 3, title: "Add Bank Account",      desc: "Add the bank account where payouts will land." },
  { id: 4, title: "Start Selling",         desc: "Make offers and earn 91% of every sale." },
]

export default function SellerOnboardingPage() {
  const { data: session } = useSession()
  const { success, info } = useToast()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  async function handleConnect() {
    setLoading(true)
    // In production: call /api/stripe/connect to create a Stripe Connect account link
    await new Promise((r) => setTimeout(r, 1200))
    info("Stripe Connect", "Redirecting to Stripe setup. Add your Stripe keys in .env.local to enable.")
    setLoading(false)
    setStep(2)
  }

  return (
    <div className="py-10 page-container max-w-3xl">
      <div className="text-center mb-10">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-7 h-7 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Set Up Your Seller Account</h1>
        <p className="text-neutral-500">Connect Stripe to receive fast, secure payouts on every sale</p>
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-between mb-10 relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-neutral-800 z-0" />
        {STEPS.map((s) => (
          <div key={s.id} className="flex flex-col items-center z-10 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              step > s.id ? "bg-green-500 border-green-500 text-white" :
              step === s.id ? "bg-orange-500 border-orange-500 text-white" :
              "bg-neutral-800 border-neutral-700 text-neutral-500"
            }`}>
              {step > s.id ? <CheckCircle className="w-4 h-4" /> : s.id}
            </div>
            <p className="text-[10px] text-neutral-500 mt-1.5 text-center font-medium max-w-[60px] leading-tight">{s.title}</p>
          </div>
        ))}
      </div>

      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
        {step === 1 && (
          <div className="p-8">
            <h2 className="text-xl font-bold text-white mb-2">Connect with Stripe</h2>
            <p className="text-neutral-500 text-sm mb-6">
              GrailMarket uses Stripe Connect to process payments securely. You'll be redirected to Stripe to complete setup.
              It takes about 5 minutes.
            </p>

            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              {[
                { icon: DollarSign, label: "91% payout",    desc: "You keep 91% of every sale" },
                { icon: Zap,        label: "Fast payouts",  desc: "Funds in 1-2 business days" },
                { icon: ShieldCheck, label: "Fully secure", desc: "Bank-grade encryption" },
              ].map((f) => (
                <div key={f.label} className="p-4 rounded-xl bg-neutral-800 text-center">
                  <f.icon className="w-5 h-5 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white">{f.label}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{f.desc}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleConnect}
              disabled={loading || !session}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#635BFF] text-white font-bold text-base hover:bg-[#5851EA] disabled:opacity-50 transition-colors"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
              {loading ? "Connecting..." : "Connect with Stripe"}
            </button>

            <p className="text-center text-xs text-neutral-500 mt-3">
              By connecting, you agree to{" "}
              <a href="https://stripe.com/connect-account/legal" target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-300">
                Stripe's Connected Account Agreement
              </a>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="p-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Stripe Connected!</h2>
            <p className="text-neutral-500 text-sm mb-6">
              Your account is being verified. This usually takes 1-3 minutes.
              In the meantime, you can start browsing grail requests.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/grails" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-400 transition-colors">
                Browse Grails <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/seller/dashboard" className="inline-flex items-center px-5 py-2.5 rounded-lg border border-neutral-800 text-neutral-300 font-semibold hover:bg-neutral-800 transition-colors">
                Seller Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 bg-neutral-800 rounded-xl border border-neutral-700 p-4 text-sm text-neutral-400">
        <strong>Dev note:</strong> Add your <code className="bg-neutral-700 px-1 rounded text-xs">STRIPE_SECRET_KEY</code> and{" "}
        <code className="bg-neutral-700 px-1 rounded text-xs">STRIPE_PUBLISHABLE_KEY</code> to{" "}
        <code className="bg-neutral-700 px-1 rounded text-xs">.env.local</code> to enable real Stripe Connect.
      </div>
    </div>
  )
}
