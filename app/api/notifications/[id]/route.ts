import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  // Allow admin to resolve any notification; otherwise only own notifications
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (notification.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { read: body.read },
  })

  return NextResponse.json(updated)
}
