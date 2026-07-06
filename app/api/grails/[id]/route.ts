import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const grail = await prisma.grailRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true, name: true, image: true, verified: true,
            verifiedSeller: true, createdAt: true,
            _count: { select: { grailRequests: true } },
          },
        },
        offers: {
          include: {
            seller: {
              select: {
                id: true, name: true, image: true, verified: true,
                verifiedSeller: true, successfulSales: true,
                ratingsReceived: { select: { score: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { offers: true } },
      },
    })

    if (!grail) {
      return NextResponse.json({ error: "Grail request not found" }, { status: 404 })
    }

    // Increment view count
    await prisma.grailRequest.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json(grail)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const grail = await prisma.grailRequest.findUnique({ where: { id } })
    if (!grail) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (grail.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updated = await prisma.grailRequest.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const grail = await prisma.grailRequest.findUnique({ where: { id } })
    if (!grail) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (grail.userId !== session.user.id && session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.grailRequest.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
