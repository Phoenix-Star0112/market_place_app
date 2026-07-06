import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Shield, ArrowLeft, CheckCircle, DollarSign, Package } from "lucide-react"
import { formatCurrency, calculateFees } from "@/lib/utils"

interface PageProps {
  params: Promise<{ offerId: string }>
}

export default async function CheckoutPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const { offerId } = await params

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      seller: { select: { id: true, name: true, verifiedSeller: true } },
      grailRequest: {
        include: { user: { select: { id: true, name: true } } },
      },
      transaction: true,
    },
  })

  if (!offer) notFound()
  if (offer.grailRequest.userId !== session.user.id) redirect("/dashboard")
  if (offer.status !== "ACCEPTED") redirect(`/grails/${offer.grailRequestId}`)

  const { platformFee, sellerPayout } = calculateFees(offer.price)

  return (
    <div className="py-8 page-container max-w-2xl">
      <Link href={`/grails/${offer.grailRequestId}`} className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Your Purchase</h1>
      <p className="text-slate-500 text-sm mb-6">Review the offer details and proceed to secure payment</p>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-4">
        <h2 className="font-semibold text-slate-900 mb-4">Order Summary</h2>

        <div className="flex items-start gap-4 pb-5 border-b border-slate-100 mb-5">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Package className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-slate-900">{offer.grailRequest.title}</p>
            <p className="text-sm text-slate-500 mt-0.5">Offered by {offer.seller.name}</p>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{offer.description}</p>
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Item price</span>
            <span className="font-medium">{formatCurrency(offer.price)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Buyer protection fee</span>
            <span className="text-slate-500 text-xs mt-0.5">Included</span>
          </div>
          <div className="flex justify-between pt-3 border-t border-slate-100">
            <span className="font-semibold text-slate-900">Total</span>
            <span className="font-bold text-xl text-slate-900">{formatCurrency(offer.price)}</span>
          </div>
        </div>
      </div>

      {/* Trust indicators */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">Secure Escrow Payment</p>
            <p className="text-xs text-green-700 mt-1">
              Your payment is held securely by GrailMarket until you confirm receipt and satisfaction.
              The seller ({offer.seller.name}) receives {formatCurrency(sellerPayout)} after completion.
            </p>
          </div>
        </div>
      </div>

      {/* CTA — in production this would load Stripe.js */}
      <div className="space-y-3">
        <button
          className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-yellow-400 text-slate-900 font-bold text-base hover:bg-yellow-300 transition-colors"
          onClick={() => alert("Stripe integration: connect your Stripe keys to enable real payments")}
        >
          <DollarSign className="w-5 h-5" />
          Pay {formatCurrency(offer.price)} Securely
        </button>
        <p className="text-center text-xs text-slate-400">
          Secured by{" "}
          <span className="font-semibold">Stripe Connect</span>
          {" · "}SSL encrypted
        </p>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-center text-xs text-slate-500">
        {["Buyer Protection", "Secure Checkout", "Dispute Resolution"].map((item) => (
          <div key={item} className="flex flex-col items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
