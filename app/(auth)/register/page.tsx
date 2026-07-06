"use client"

import Link from "next/link"
import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Trophy, Eye, EyeOff, Loader2, ShoppingBag, Package, CheckCircle } from "lucide-react"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") === "seller" ? "SELLER" : "BUYER"

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState(defaultRole)
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<"form" | "signing-in" | "done">("form")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirmPassword) { setError("Passwords do not match"); return }
    if (!agreed) { setError("Please accept the terms of service"); return }

    setLoading(true)
    setError("")

    try {
      // Step 1: Create account
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.")
        setLoading(false)
        return
      }

      // Step 2: Auto sign-in
      setStep("signing-in")

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error || !result?.ok) {
        // Account was created but auto-login failed — redirect to login manually
        setStep("done")
        setTimeout(() => router.push("/login?registered=1"), 1500)
        return
      }

      // Step 3: Navigate to dashboard
      setStep("done")
      router.push("/dashboard")

    } catch (err) {
      console.error("Registration error:", err)
      setError("Something went wrong. Please try again.")
      setLoading(false)
      setStep("form")
    }
  }

  // Done state
  if (step === "done") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Account created!</h2>
        <p className="text-slate-500 text-sm">Taking you to your dashboard…</p>
      </div>
    )
  }

  const buttonLabel =
    step === "signing-in" ? "Signing in…" : loading ? "Creating account…" : "Create Account"

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-1">Create your account</h1>
      <p className="text-slate-500 text-sm mb-6">Join thousands of serious collectors</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {(["BUYER", "SELLER"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              role === r ? "border-yellow-400 bg-yellow-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            {r === "BUYER"
              ? <ShoppingBag className={`w-5 h-5 ${role === r ? "text-yellow-600" : "text-slate-400"}`} />
              : <Package    className={`w-5 h-5 ${role === r ? "text-yellow-600" : "text-slate-400"}`} />}
            <div>
              <div className={`text-sm font-semibold ${role === r ? "text-slate-900" : "text-slate-600"}`}>
                {r === "BUYER" ? "I'm a Buyer" : "I'm a Seller"}
              </div>
              <div className="text-xs text-slate-400">
                {r === "BUYER" ? "Post grail requests" : "Submit offers"}
              </div>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            required minLength={2} placeholder="John Smith"
            className="input-field" disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            required placeholder="you@example.com"
            className="input-field" disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"} value={password}
              onChange={(e) => setPassword(e.target.value)}
              required minLength={8} placeholder="Min. 8 characters"
              className="input-field pr-10" disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
          <input
            type="password" value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required placeholder="••••••••"
            className="input-field" disabled={loading}
          />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox" checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-yellow-500 focus:ring-yellow-400"
            disabled={loading}
          />
          <span className="text-xs text-slate-600">
            I agree to the{" "}
            <Link href="/terms" className="text-yellow-600 hover:text-yellow-700">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-yellow-600 hover:text-yellow-700">Privacy Policy</Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !agreed}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-yellow-400 text-slate-900 font-semibold hover:bg-yellow-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {buttonLabel}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-yellow-600 font-medium hover:text-yellow-700">Sign in</Link>
      </p>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="w-9 h-9 bg-yellow-400 rounded-xl flex items-center justify-center">
              <Trophy className="w-5 h-5 text-yellow-900" />
            </div>
            GrailMarket
          </Link>
        </div>
        <Suspense fallback={<div className="h-96 bg-white rounded-2xl border border-slate-200 animate-pulse" />}>
          <RegisterForm />
        </Suspense>
      </div>
    </div>
  )
}
