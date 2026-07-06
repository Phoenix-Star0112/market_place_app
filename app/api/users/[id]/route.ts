import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        image: true,
        bio: true,
        location: true,
        verified: true,
        verifiedSeller: true,
        role: true,
        successfulSales: true,
        totalPurchases: true,
        createdAt: true,
        grailRequests: {
          where: { status: "ACTIVE" },
          take: 6,
          orderBy: { createdAt: "desc" },
          select: {
            id: true, title: true, category: true, budgetMin: true,
            budgetMax: true, images: true, createdAt: true,
          },
        },
        ratingsReceived: {
          include: { giver: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: { grailRequests: true, offers: true, ratingsReceived: true },
        },
      },
    })

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const avgRating =
      user.ratingsReceived.length > 0
        ? user.ratingsReceived.reduce((sum, r) => sum + r.score, 0) /
          user.ratingsReceived.length
        : null

    return NextResponse.json({ ...user, avgRating })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (session.user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const allowed = ["name", "bio", "location", "image"]
    const data = Object.fromEntries(
      Object.entries(body).filter(([key]) => allowed.includes(key))
    )

    const user = await prisma.user.update({ where: { id }, data })
    return NextResponse.json(user)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
