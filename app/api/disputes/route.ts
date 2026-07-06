import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const schema = z.object({
  offerId: z.string(),
  reason: z.enum(["item_not_as_described", "item_not_received", "fraud", "payment_issue", "other"]),
  description: z.string().min(20).max(2000),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { offerId, reason, description } = schema.parse(body)

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { grailRequest: { select: { userId: true } } },
    })

    if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 })

    const isParty = offer.sellerId === session.user.id || offer.grailRequest.userId === session.user.id
    if (!isParty) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Send notification to admin
    const admins = await prisma.user.findMany({ where: { role: "ADMIN" } })
    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            type: "DISPUTE",
            title: "New Dispute Filed",
            message: `Dispute on offer ${offerId}: ${reason}`,
            link: `/admin/disputes/${offerId}`,
            userId: admin.id,
          },
        })
      )
    )

    return NextResponse.json({ success: true, message: "Dispute filed. Our team will review within 24 hours." }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
