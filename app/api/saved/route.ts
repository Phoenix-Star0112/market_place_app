import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const saved = await prisma.savedOffer.findMany({
      where: { userId: session.user.id },
      include: {
        grailRequest: {
          include: {
            user: { select: { id: true, name: true, image: true, verified: true } },
            _count: { select: { offers: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(saved)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { grailRequestId } = await req.json()

    const existing = await prisma.savedOffer.findUnique({
      where: { userId_grailRequestId: { userId: session.user.id, grailRequestId } },
    })

    if (existing) {
      await prisma.savedOffer.delete({
        where: { userId_grailRequestId: { userId: session.user.id, grailRequestId } },
      })
      return NextResponse.json({ saved: false })
    }

    await prisma.savedOffer.create({
      data: { userId: session.user.id, grailRequestId },
    })
    return NextResponse.json({ saved: true }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
