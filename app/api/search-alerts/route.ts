import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createSchema = z.object({
  keywords:  z.string().min(2).max(100),
  category:  z.string().default(""),
  budgetMin: z.number().positive().optional(),
  budgetMax: z.number().positive().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const alerts = await prisma.searchAlert.findMany({
    where: { userId: session.user.id, active: true },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(alerts)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    // Cap at 10 alerts per user
    const count = await prisma.searchAlert.count({ where: { userId: session.user.id, active: true } })
    if (count >= 10) {
      return NextResponse.json({ error: "Maximum 10 active alerts per account" }, { status: 400 })
    }

    const alert = await prisma.searchAlert.create({
      data: { ...data, userId: session.user.id },
    })
    return NextResponse.json(alert, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const alert = await prisma.searchAlert.findUnique({ where: { id } })
  if (!alert || alert.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.searchAlert.update({ where: { id }, data: { active: false } })
  return NextResponse.json({ success: true })
}
