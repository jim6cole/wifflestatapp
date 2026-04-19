import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  // ⚡ FIX: Removed trustHost (v5 only). v4 trusts proxies via NEXTAUTH_URL.
  
  // ⚡ Ensure cookies work over HTTPS for mobile
  useSecureCookies: process.env.NODE_ENV === "production",

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

        if (!user) {
          throw new Error("Invalid Clearance Credentials.");
        }

        if (!user.emailVerified) {
          throw new Error("Clearance Pending. Please verify your email address.");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid Clearance Credentials.");
        }

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
          where: { email: token.email },
          include: { memberships: true }
        });
        if (freshUser) {
           token.memberships = freshUser.memberships;
        }
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
  pages: {
    signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };