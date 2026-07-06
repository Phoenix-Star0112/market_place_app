import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-05-27.dahlia",
})

export async function createConnectAccount(email: string) {
  return await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })
}

export async function createAccountLink(accountId: string, baseUrl: string) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/seller/onboarding?refresh=true`,
    return_url: `${baseUrl}/seller/onboarding?success=true`,
    type: "account_onboarding",
  })
}

export async function createPaymentIntent(
  amount: number,
  sellerId: string,
  offerId: string,
  sellerStripeId: string
) {
  const platformFeeAmount = Math.round(amount * 0.09 * 100)
  const totalAmount = Math.round(amount * 100)

  return await stripe.paymentIntents.create({
    amount: totalAmount,
    currency: "usd",
    application_fee_amount: platformFeeAmount,
    transfer_data: {
      destination: sellerStripeId,
    },
    metadata: {
      offerId,
      sellerId,
    },
  })
}

export async function capturePaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.capture(paymentIntentId)
}

export async function cancelPaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.cancel(paymentIntentId)
}
