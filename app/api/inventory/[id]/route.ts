import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()

    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (item.sellerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    const allowed = ["available", "price", "description", "title"]
    const data = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

    const updated = await prisma.inventoryItem.update({ where: { id }, data })
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
    const item = await prisma.inventoryItem.findUnique({ where: { id } })
    if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
    if (item.sellerId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    await prisma.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
