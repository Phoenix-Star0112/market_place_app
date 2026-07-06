import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createOfferSchema = z.object({
  grailRequestId: z.string(),
  price: z.number().positive(),
  description: z.string().min(10).max(2000),
  condition: z.string(),
  images: z.array(z.string()).default([]),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = createOfferSchema.parse(body)

    // Verify the grail exists and is active
    const grail = await prisma.grailRequest.findUnique({
      where: { id: data.grailRequestId },
    })
    if (!grail) return NextResponse.json({ error: "Grail request not found" }, { status: 404 })
    if (grail.status !== "ACTIVE") {
      return NextResponse.json({ error: "This request is no longer active" }, { status: 400 })
    }
    if (grail.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot offer on your own request" }, { status: 400 })
    }

    // Check if seller already has a pending offer on this grail
    const existingOffer = await prisma.offer.findFirst({
      where: {
        grailRequestId: data.grailRequestId,
        sellerId: session.user.id,
        status: "PENDING",
      },
    })
    if (existingOffer) {
      return NextResponse.json(
        { error: "You already have a pending offer on this request" },
        { status: 409 }
      )
    }

    const offer = await prisma.offer.create({
      data: {
        ...data,
        images: JSON.stringify(data.images),
        sellerId: session.user.id,
      },
      include: {
        seller: { select: { id: true, name: true, image: true, verifiedSeller: true } },
        grailRequest: {
          select: { id: true, title: true, userId: true },
        },
      },
    })

    // Create notification for the buyer
    await prisma.notification.create({
      data: {
        type: "NEW_OFFER",
        title: "New Offer Received",
        message: `${offer.seller.name} made an offer on "${offer.grailRequest.title}"`,
        link: `/grails/${data.grailRequestId}`,
        userId: grail.userId,
      },
    })

    // Create conversation thread for this offer
    await prisma.conversation.create({
      data: { offerId: offer.id },
    })

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
