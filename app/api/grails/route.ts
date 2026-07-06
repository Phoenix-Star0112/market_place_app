import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createGrailSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  category: z.string(),
  condition: z.string(),
  budgetMin: z.number().positive(),
  budgetMax: z.number().positive(),
  images: z.array(z.string()).default([]),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const category = searchParams.get("category")
    const status = searchParams.get("status") || "ACTIVE"
    const search = searchParams.get("search")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit

    const where: any = { status }
    if (category && category !== "all") where.category = category
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ]
    }

    const [grails, total] = await Promise.all([
      prisma.grailRequest.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, image: true, verified: true, verifiedSeller: true },
          },
          offers: { select: { id: true, status: true } },
          _count: { select: { offers: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.grailRequest.count({ where }),
    ])

    return NextResponse.json({
      grails,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createGrailSchema.parse(body)

    const grail = await prisma.grailRequest.create({
      data: {
        ...data,
        images: JSON.stringify(data.images),
        userId: session.user.id,
      },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    // Match SearchAlert notifications (up to 20)
    try {
      const alerts = await (prisma as any).searchAlert.findMany({
        where: { active: true },
        take: 100,
      })
      const titleLower = grail.title.toLowerCase()
      const matchingAlerts = alerts.filter((alert: any) => {
        if (alert.userId === session.user.id) return false // don't notify self
        const categoryMatch = !alert.category || alert.category === grail.category
        if (!categoryMatch) return false
        const keywords = alert.keywords.toLowerCase().split(/\s+/).filter(Boolean)
        return keywords.some((kw: string) => titleLower.includes(kw))
      }).slice(0, 20)

      if (matchingAlerts.length > 0) {
        await prisma.notification.createMany({
          data: matchingAlerts.map((alert: any) => ({
            type: "MATCH_ALERT",
            title: "New Grail Match",
            message: `A new grail request matches your alert: "${grail.title}"`,
            link: `/grails/${grail.id}`,
            userId: alert.userId,
          })),
        })
      }
    } catch (e) {
      console.error("Match alert error:", e)
    }

    return NextResponse.json(grail, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
