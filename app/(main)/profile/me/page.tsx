import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * /profile/me — resolves to the current user's profile page.
 * Always validates the user still exists in the DB, so stale cookies
 * after a re-seed don't cause a 404 — they get a graceful re-login prompt.
 */
export default async function MyProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/profile/me")
  }

  // Validate the user still exists (guards against stale cookies after re-seeding)
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  })

  if (!user) {
    // Session references a deleted/re-seeded user — send to sign-out page
    redirect("/auth/session-expired")
  }

  redirect(`/profile/${user.id}`)
}
