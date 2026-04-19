import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // ⚡ THE MOBILE FIX: Manually define cookies to handle the Cloudflare Proxy correctly
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? `__Secure-next-auth.session-token` : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax', // Use 'lax' for better mobile compatibility
        path: '/',
        secure: process.env.NEXTAUTH_URL?.startsWith('https://') ?? false
      }
    }
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const normalizedEmail = credentials.email.toLowerCase().trim();
        
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: { memberships: true }
        });

        if (!user || !user.emailVerified) {
          throw new Error("Invalid Credentials or Unverified Account.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) throw new Error("Invalid Credentials.");

        return { 
          id: user.id.toString(), 
          email: user.email, 
          name: user.name, 
          isGlobalAdmin: user.isGlobalAdmin,
          memberships: user.memberships 
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.isGlobalAdmin = (user as any).isGlobalAdmin;
        token.memberships = (user as any).memberships;
      }
      if (trigger === "update" && token.email) {
        const freshUser = await prisma.user.findUnique({
          where: { email: token.email }, include: { memberships: true }
        });
        if (freshUser) token.memberships = freshUser.memberships;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).isGlobalAdmin = token.isGlobalAdmin;
        (session.user as any).memberships = token.memberships;
      }
      return session;
    }
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };