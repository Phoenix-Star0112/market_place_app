import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const transactions = await prisma.transaction.findMany({
      where: {
        offer: {
          OR: [
            { sellerId: session.user.id },
            { grailRequest: { userId: session.user.id } },
          ],
        },
      },
      include: {
        offer: {
          include: {
            seller: { select: { id: true, name: true, image: true } },
            grailRequest: {
              include: { user: { select: { id: true, name: true, image: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
