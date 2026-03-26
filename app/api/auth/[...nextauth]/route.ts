import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        // Fetch the user AND all of their league memberships
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { memberships: true }
        });

        if (!user) {
          throw new Error("Invalid Clearance Credentials.");
        }

        // ===================================================
        // NEW: BLOCK UNVERIFIED ACCOUNTS
        // ===================================================
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
          memberships: user.memberships // Attach the array of leagues they belong to!
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.isGlobalAdmin = (user as any).isGlobalAdmin;
        token.memberships = (user as any).memberships;
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