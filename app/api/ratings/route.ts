import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const schema = z.object({
  score:      z.number().int().min(1, "Score must be at least 1").max(5, "Score must be at most 5"),
  comment:    z.string().max(500, "Comment must be 500 characters or fewer").optional(),
  receiverId: z.string().min(1, "Recipient is required"),
  offerId:    z.string().min(1, "Offer ID is required"),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const { score, comment, receiverId, offerId } = schema.parse(body)

    if (receiverId === session.user.id) {
      return NextResponse.json({ error: "Cannot rate yourself" }, { status: 400 })
    }

    // Prevent duplicate ratings for the same offer by the same giver
    const existing = await prisma.rating.findFirst({
      where: { giverId: session.user.id, offerId } as any,
    })
    if (existing) {
      return NextResponse.json({ error: "You have already rated this transaction" }, { status: 409 })
    }

    const rating = await prisma.rating.create({
      data: {
        score,
        comment: comment || null,
        giverId: session.user.id,
        receiverId,
        offerId,
      } as any,
      include: {
        giver: { select: { name: true } },
        receiver: { select: { name: true } },
      },
    })

    // Notify the receiver
    await prisma.notification.create({
      data: {
        type: "NEW_RATING",
        title: "New Rating Received",
        message: `${rating.giver.name} left you a ${score}-star review`,
        link: `/profile/${receiverId}`,
        userId: receiverId,
      },
    })

    return NextResponse.json(rating, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
