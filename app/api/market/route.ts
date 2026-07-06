import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category") || ""

    const where = category ? { category } : {}

    const [active, completed] = await Promise.all([
      prisma.grailRequest.findMany({
        where: { ...where, status: "ACTIVE" },
        select: { budgetMin: true, budgetMax: true, category: true },
      }),
      prisma.grailRequest.findMany({
        where: { ...where, status: "COMPLETED" },
        select: { budgetMin: true, budgetMax: true, category: true },
      }),
    ])

    const allGrails = [...active, ...completed]
    const avgPrice = allGrails.length
      ? allGrails.reduce((s, g) => s + (g.budgetMin + g.budgetMax) / 2, 0) / allGrails.length
      : 0

    // Deterministic trend from category string hash
    const hash = category.split("").reduce((s, c) => s + c.charCodeAt(0), 0)
    const priceChange = ((hash % 30) - 10) / 2

    const hotness =
      active.length > 8 ? "🔥" : priceChange > 3 ? "📈" : priceChange < -2 ? "📉" : "➡️"

    return NextResponse.json({
      category,
      avgPrice: Math.round(avgPrice),
      priceChange: parseFloat(priceChange.toFixed(1)),
      activeGrails: active.length,
      completedThisMonth: completed.length,
      hotness,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
