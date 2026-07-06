import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "6")

    // Trending = most offers in last 7 days, weighted by views
    const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000)

    const grails = await prisma.grailRequest.findMany({
      where: { status: "ACTIVE" },
      include: {
        user: { select: { id: true, name: true, image: true, verified: true } },
        offers: {
          where: { createdAt: { gte: sevenDaysAgo } },
          select: { id: true },
        },
        _count: { select: { offers: true } },
      },
      orderBy: [{ views: "desc" }],
      take: 50,
    })

    // Score: recent offers * 10 + views * 0.05 + budget weight
    const scored = grails
      .map((g) => ({
        ...g,
        trendScore:
          g.offers.length * 10 +
          g.views * 0.05 +
          Math.log10(Math.max(g.budgetMax, 10)) * 3,
      }))
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)

    return NextResponse.json(scored)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
