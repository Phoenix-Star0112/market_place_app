import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

const createSchema = z.object({
  title:       z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000),
  category:    z.string().min(1, "Category is required"),
  condition:   z.string().min(1, "Condition is required"),
  price:       z.number().positive("Price must be positive"),
  images:      z.array(z.string()).default([]),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const items = await prisma.inventoryItem.findMany({
      where: { sellerId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await req.json()
    const data = createSchema.parse(body)

    const item = await prisma.inventoryItem.create({
      data: {
        ...data,
        images: JSON.stringify(data.images),
        sellerId: session.user.id,
      },
    })
    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
