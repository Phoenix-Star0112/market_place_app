import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  // No adapter needed — we use JWT sessions + credentials only.
  // PrismaAdapter is incompatible with Prisma 7 driver adapters and is unnecessary here.
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user || !user.password) return null

          const passwordMatch = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!passwordMatch) return null

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            verified: user.verified,
            verifiedSeller: user.verifiedSeller,
            image: user.image,
          }
        } catch (error) {
          console.error("[NextAuth] authorize error:", error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.verified = (user as any).verified
        token.verifiedSeller = (user as any).verifiedSeller
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.verified = token.verified as boolean
        session.user.verifiedSeller = token.verifiedSeller as boolean
      }
      return session
    },
  },
}
