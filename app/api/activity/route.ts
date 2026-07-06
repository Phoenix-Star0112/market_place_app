import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { formatCurrency, getCategoryLabel } from "@/lib/utils"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    const [recentGrails, recentOffers, recentRatings, completedTx] = await Promise.all([
      prisma.grailRequest.findMany({
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: Math.ceil(limit / 3),
        include: { user: { select: { name: true } } },
      }),
      prisma.offer.findMany({
        where: { status: { in: ["ACCEPTED", "PENDING"] } },
        orderBy: { createdAt: "desc" },
        take: Math.ceil(limit / 3),
        include: {
          seller: { select: { name: true } },
          grailRequest: { select: { id: true, title: true } },
        },
      }),
      prisma.rating.findMany({
        orderBy: { createdAt: "desc" },
        take: Math.ceil(limit / 4),
        include: {
          giver: { select: { name: true } },
          receiver: { select: { name: true } },
        },
      }),
      prisma.transaction.findMany({
        where: { status: "COMPLETED" },
        orderBy: { createdAt: "desc" },
        take: Math.ceil(limit / 4),
        include: { offer: { include: { grailRequest: { select: { id: true, title: true } } } } },
      }),
    ])

    const activities = [
      ...recentGrails.map((g) => ({
        id: `grail-${g.id}`,
        type: "new_grail" as const,
        title: g.title,
        subtitle: `${g.user.name} is hunting for this grail`,
        link: `/grails/${g.id}`,
        time: g.createdAt.toISOString(),
        meta: `${formatCurrency(g.budgetMin)}–${formatCurrency(g.budgetMax)}`,
      })),
      ...recentOffers.map((o) => ({
        id: `offer-${o.id}`,
        type: (o.status === "ACCEPTED" ? "offer_accepted" : "new_offer") as "offer_accepted" | "new_offer",
        title: o.status === "ACCEPTED"
          ? `Offer accepted on "${o.grailRequest.title}"`
          : `New offer on "${o.grailRequest.title}"`,
        subtitle: `${o.seller.name} made an offer`,
        link: `/grails/${o.grailRequestId}`,
        time: o.createdAt.toISOString(),
        meta: formatCurrency(o.price),
      })),
      ...recentRatings.map((r) => ({
        id: `rating-${r.id}`,
        type: "new_rating" as const,
        title: `${r.giver.name} rated ${r.receiver.name}`,
        subtitle: `${"⭐".repeat(r.score)} review left`,
        time: r.createdAt.toISOString(),
        meta: `${r.score}/5`,
      })),
      ...completedTx.map((t) => ({
        id: `tx-${t.id}`,
        type: "completed" as const,
        title: `Sale completed: "${t.offer.grailRequest.title}"`,
        subtitle: "Transaction completed successfully",
        link: `/grails/${t.offer.grailRequestId}`,
        time: t.createdAt.toISOString(),
        meta: formatCurrency(t.amount),
      })),
    ]

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json(activities.slice(0, limit))
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
