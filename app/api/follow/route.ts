import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 })

  try {
    const followerCount = await prisma.follow.count({ where: { followingId: userId } })
    const followingCount = await prisma.follow.count({ where: { followerId: userId } })

    let isFollowing = false
    if (session) {
      const record = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: session.user.id, followingId: userId } },
      })
      isFollowing = !!record
    }

    return NextResponse.json({ followerCount, followingCount, isFollowing })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { followingId } = await req.json()

    if (followingId === session.user.id) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 })
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId } },
    })

    if (existing) {
      await prisma.follow.delete({
        where: { followerId_followingId: { followerId: session.user.id, followingId } },
      })
      return NextResponse.json({ following: false })
    }

    await prisma.follow.create({
      data: { followerId: session.user.id, followingId },
    })

    // Notify the followed user
    const follower = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    })
    await prisma.notification.create({
      data: {
        type: "NEW_FOLLOWER",
        title: "New Follower",
        message: `${follower?.name} started following you`,
        link: `/profile/${session.user.id}`,
        userId: followingId,
      },
    })

    return NextResponse.json({ following: true }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
