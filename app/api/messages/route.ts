import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { sanitizeMessage, hasOffPlatformContent } from "@/lib/utils"

const sendMessageSchema = z.object({
  conversationId: z.string(),
  content: z.string().min(1).max(2000),
})

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get("conversationId")

    if (!conversationId) {
      // Return all conversations for this user
      const conversations = await prisma.conversation.findMany({
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
                include: {
                  user: { select: { id: true, name: true, image: true } },
                },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { messages: { where: { read: false, senderId: { not: session.user.id } } } },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
      return NextResponse.json(conversations)
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: session.user.id },
        read: false,
      },
      data: { read: true },
    })

    return NextResponse.json(messages)
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
    const { conversationId, content } = sendMessageSchema.parse(body)

    // Sanitize message to prevent off-platform contact sharing
    const sanitized = sanitizeMessage(content)
    const wasModified = sanitized !== content

    const message = await prisma.message.create({
      data: {
        content: sanitized,
        senderId: session.user.id,
        conversationId,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    })

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json({ ...message, wasModified }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Validation error" }, { status: 400 })
    }
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
