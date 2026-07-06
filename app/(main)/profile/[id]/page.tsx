import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  Star, ShieldCheck, MapPin, Calendar, Trophy, Package, UserPlus, UserCheck,
} from "lucide-react"
import { formatDate, formatCurrency, getCategoryLabel } from "@/lib/utils"

interface PageProps {
  params: Promise<{ id: string }>
}

// ── Trust score ────────────────────────────────────────────────────────────────

function calcTrustScore(user: {
  verified: boolean
  verifiedSeller: boolean
  successfulSales: number
  avgRating: number | null
  bio: string | null
  location: string | null
  createdAt: Date | string
}): number {
  let score = 0
  if (user.verified) score += 20
  if (user.verifiedSeller) score += 25
  score += Math.min(user.successfulSales * 2, 20)
  if (user.avgRating !== null) {
    if (user.avgRating >= 4.5) score += 15
    else if (user.avgRating >= 4) score += 10
    else if (user.avgRating >= 3) score += 5
  }
  if (user.bio) score += 5
  if (user.location) score += 5
  const ageDays = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (ageDays > 365) score += 10
  else if (ageDays > 180) score += 5
  return score
}

// ── Trust ring SVG ─────────────────────────────────────────────────────────────

function TrustRing({ score }: { score: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color =
    score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : score >= 40 ? "#f97316" : "#94a3b8"
  const label =
    score >= 80
      ? "Highly Trusted"
      : score >= 60
      ? "Trusted"
      : score >= 40
      ? "Building Trust"
      : "New Member"
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="48" textAnchor="middle" fontSize="18" fontWeight="bold" fill={color}>
          {score}
        </text>
      </svg>
      <span className="text-xs font-medium" style={{ color }}>
        {label}
      </span>
    </div>
  )
}

// ── generateMetadata ───────────────────────────────────────────────────────────

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id }, select: { name: true, bio: true } })
  return {
    title: user ? `${user.name} — GrailMarket` : "Profile — GrailMarket",
    description: user?.bio ?? `View ${user?.name}'s profile on GrailMarket`,
  }
}

// ── Server action: follow toggle ───────────────────────────────────────────────

async function toggleFollow(formData: FormData) {
  "use server"
  const { revalidatePath } = await import("next/cache")
  const followingId = formData.get("followingId") as string
  if (!followingId) return

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return

  // Guard: confirm both users actually exist in DB (prevents FK error after re-seed)
  const [follower, following] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } }),
    prisma.user.findUnique({ where: { id: followingId }, select: { id: true } }),
  ])
  if (!follower || !following) return

  try {
    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: session.user.id, followingId } },
    })
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } })
    } else {
      await prisma.follow.create({ data: { followerId: session.user.id, followingId } })
    }
  } catch {
    // Swallow constraint errors gracefully
  }
  revalidatePath(`/profile/${followingId}`)
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const isOwnProfile = session?.user?.id === id

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      location: true,
      verified: true,
      verifiedSeller: true,
      role: true,
      successfulSales: true,
      totalPurchases: true,
      createdAt: true,
      image: true,
      specialties: true,
      grailRequests: {
        where: { status: "ACTIVE" },
        take: 6,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          category: true,
          budgetMin: true,
          budgetMax: true,
          images: true,
          createdAt: true,
        },
      },
      ratingsReceived: {
        include: { giver: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
      _count: {
        select: {
          grailRequests: true,
          offers: true,
          ratingsReceived: true,
          followers: true,
          following: true,
        },
      },
    },
  })

  if (!user) notFound()

  // Recent offers (if seller)
  const recentOffers =
    user.verifiedSeller || user.role === "SELLER"
      ? await prisma.offer.findMany({
          where: { sellerId: id },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { grailRequest: { select: { id: true, title: true } } },
        })
      : []

  // Check if current user is following this profile
  let isFollowing = false
  if (session && !isOwnProfile) {
    const followRecord = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: session.user.id, followingId: id },
      },
    })
    isFollowing = !!followRecord
  }

  const avgRating =
    user.ratingsReceived.length > 0
      ? user.ratingsReceived.reduce((s, r) => s + r.score, 0) / user.ratingsReceived.length
      : null

  const trustScore = calcTrustScore({
    verified: user.verified,
    verifiedSeller: user.verifiedSeller,
    successfulSales: user.successfulSales,
    avgRating,
    bio: user.bio,
    location: user.location,
    createdAt: user.createdAt,
  })

  // Parse specialties JSON
  let specialties: string[] = []
  try {
    specialties = JSON.parse(user.specialties || "[]") as string[]
  } catch {
    specialties = []
  }

  const offerStatusColor: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    ACCEPTED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    COUNTERED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    COMPLETED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  }

  return (
    <div className="py-8 page-container max-w-4xl">
      {/* ── Hero card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-4xl font-bold text-yellow-800 dark:text-yellow-300 flex-shrink-0 overflow-hidden">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? "Avatar"} className="w-full h-full object-cover" />
            ) : (
              user.name?.[0]?.toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{user.name}</h1>
              {user.verified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Verified
                </span>
              )}
              {user.verifiedSeller && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold">
                  <ShieldCheck className="w-3 h-3" /> Verified Seller
                </span>
              )}
            </div>
            {user.bio && (
              <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">{user.bio}</p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400">
              {user.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {user.location}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Joined {formatDate(user.createdAt)}
              </span>
            </div>

            {/* Follow button */}
            {!isOwnProfile && session && (
              <form action={toggleFollow} className="mt-4">
                <input type="hidden" name="followingId" value={id} />
                <button
                  type="submit"
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    isFollowing
                      ? "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"
                      : "bg-yellow-500 text-white hover:bg-yellow-600"
                  }`}
                >
                  {isFollowing ? (
                    <><UserCheck className="w-4 h-4" /> Following</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Follow</>
                  )}
                </button>
              </form>
            )}
            {!isOwnProfile && !session && (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-500 text-white hover:bg-yellow-600 transition-colors mt-4"
              >
                <UserPlus className="w-4 h-4" /> Follow
              </Link>
            )}
          </div>

          {/* Trust Score ring */}
          <div className="flex-shrink-0">
            <TrustRing score={trustScore} />
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-5 gap-4 mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {user._count.grailRequests}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Requests</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {user.successfulSales}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Sales</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {user.totalPurchases}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Purchases</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-1">
              {avgRating ? (
                <>
                  <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />
                  {Number(avgRating).toFixed(1)}
                </>
              ) : (
                "—"
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Rating</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {user._count.followers}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Followers</div>
          </div>
        </div>
      </div>

      {/* ── Two-column section ── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* LEFT column */}
        <div className="space-y-6">
          {/* Active Grail Requests */}
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" /> Active Grail Requests
            </h2>
            {user.grailRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400">
                No active requests
              </div>
            ) : (
              <div className="space-y-3">
                {user.grailRequests.map((grail) => (
                  <Link
                    key={grail.id}
                    href={`/grails/${grail.id}`}
                    className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:shadow-sm transition-all"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {grail.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getCategoryLabel(grail.category)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-yellow-600 flex-shrink-0">
                      {formatCurrency(grail.budgetMin)}–{formatCurrency(grail.budgetMax)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Specialties chips */}
          {specialties.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-purple-500" /> Specialties
              </h2>
              <div className="flex flex-wrap gap-2">
                {specialties.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT column */}
        <div className="space-y-6">
          {/* Reviews */}
          <div>
            <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" /> Reviews ({user._count.ratingsReceived})
            </h2>
            {user.ratingsReceived.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 text-center text-sm text-slate-400">
                No reviews yet
              </div>
            ) : (
              <div className="space-y-3">
                {user.ratingsReceived.map((rating) => (
                  <div
                    key={rating.id}
                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < rating.score ? "text-yellow-400" : "text-slate-200 dark:text-slate-600"
                            }`}
                            fill="currentColor"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        by {rating.giver.name}
                      </span>
                    </div>
                    {rating.comment && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">{rating.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Offer Activity (sellers only) */}
          {recentOffers.length > 0 && (
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" /> Recent Offer Activity
              </h2>
              <div className="space-y-3">
                {recentOffers.map((offer) => (
                  <Link
                    key={offer.id}
                    href={`/grails/${offer.grailRequest.id}`}
                    className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 hover:shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {offer.grailRequest.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatCurrency(offer.price)} · {formatDate(offer.createdAt)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                        offerStatusColor[offer.status] ??
                        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {offer.status.charAt(0) + offer.status.slice(1).toLowerCase()}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
