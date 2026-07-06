import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("counter"),
    counterPrice: z.number().positive("Counter price must be positive"),
    counterNote: z.string().min(1, "Counter note is required"),
  }),
  z.object({
    action: z.literal("status"),
    status: z.enum(["ACCEPTED", "DECLINED", "WITHDRAWN"]),
  }),
  // Legacy: allow direct status field without action key
]).or(
  z.object({
    status: z.enum(["ACCEPTED", "DECLINED", "WITHDRAWN"]),
    action: z.undefined(),
  })
)

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const offer = await prisma.offer.findUnique({
      where: { id },
      include: { grailRequest: true },
    })

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 })

    const isBuyer = offer.grailRequest.userId === session.user.id
    const isSeller = offer.sellerId === session.user.id

    // Determine action: explicit "action" field or fall back to legacy "status" field
    const action = body.action as string | undefined
    const status = body.status as string | undefined

    // --- Counter-offer branch ---
    if (action === "counter") {
      const parsed = z.object({
        counterPrice: z.number().positive("Counter price must be positive"),
        counterNote: z.string().min(1, "Counter note is required"),
      }).safeParse(body)

      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0].message },
          { status: 400 }
        )
      }

      if (!isSeller) {
        return NextResponse.json({ error: "Only the seller can make a counter-offer" }, { status: 403 })
      }

      // Can only counter a PENDING offer
      if (offer.status !== "PENDING") {
        return NextResponse.json({ error: "Can only counter a pending offer" }, { status: 400 })
      }

      const updated = await prisma.offer.update({
        where: { id },
        data: {
          status: "COUNTERED",
          counterPrice: parsed.data.counterPrice,
          counterNote: parsed.data.counterNote,
        },
      })

      // Notify the buyer about the counter-offer
      await prisma.notification.create({
        data: {
          type: "OFFER_COUNTERED",
          title: "Counter-Offer Received",
          message: `The seller has countered your offer on "${offer.grailRequest.title}" with $${parsed.data.counterPrice.toFixed(2)}.`,
          link: `/grails/${offer.grailRequestId}`,
          userId: offer.grailRequest.userId,
        },
      })

      return NextResponse.json(updated)
    }

    // --- Accept / Decline / Withdraw branch ---
    if (!status) {
      return NextResponse.json({ error: "Missing action or status" }, { status: 400 })
    }

    if (status === "ACCEPTED" && !isBuyer) {
      return NextResponse.json({ error: "Only the buyer can accept offers" }, { status: 403 })
    }
    if (status === "DECLINED" && !isBuyer) {
      return NextResponse.json({ error: "Only the buyer can decline offers" }, { status: 403 })
    }
    if (status === "WITHDRAWN" && !isSeller) {
      return NextResponse.json({ error: "Only the seller can withdraw offers" }, { status: 403 })
    }

    // When accepting a COUNTERED offer, use the counterPrice as the final price
    const wasCountered = offer.status === "COUNTERED"
    const finalPrice = wasCountered && status === "ACCEPTED" && offer.counterPrice
      ? offer.counterPrice
      : offer.price

    const updateData: Record<string, unknown> = { status }
    if (wasCountered && status === "ACCEPTED" && offer.counterPrice) {
      updateData.price = finalPrice
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: updateData,
    })

    if (status === "ACCEPTED") {
      const acceptMessage = wasCountered && offer.counterPrice
        ? `Your counter-offer of $${finalPrice.toFixed(2)} on "${offer.grailRequest.title}" was accepted. Proceed to payment.`
        : `Your offer on "${offer.grailRequest.title}" was accepted. Proceed to payment.`

      await prisma.notification.create({
        data: {
          type: "OFFER_ACCEPTED",
          title: "Offer Accepted!",
          message: acceptMessage,
          link: `/offers/${id}/checkout`,
          userId: offer.sellerId,
        },
      })
      // Close the grail request
      await prisma.grailRequest.update({
        where: { id: offer.grailRequestId },
        data: { status: "IN_PROGRESS" },
      })
    } else if (status === "DECLINED") {
      await prisma.notification.create({
        data: {
          type: "OFFER_DECLINED",
          title: "Offer Declined",
          message: `Your offer on "${offer.grailRequest.title}" was declined.`,
          link: `/grails/${offer.grailRequestId}`,
          userId: offer.sellerId,
        },
      })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
