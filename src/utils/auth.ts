 import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, User, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./connect";

declare module "next-auth" {
  interface Session {
    user: User & {
      isAdmin: Boolean;
    };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    isAdmin: Boolean;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      // clientId: process.env.GOOGLE_ID as string,
      // clientSecret: process.env.GOOGLE_SECRET as string,
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async session({ token, session }) {
      session.user.isAdmin = token.isAdmin ?? false;
      return session;
    },
    async jwt({ token }) {
      // OAuth tokens can briefly lack an email. Avoid passing null to Prisma,
      // which would fail session loading for those callbacks.
      if (!token.email) {
        token.isAdmin = false;
        return token;
      }

      const userInDb = await prisma.user.findUnique({
        where: {
          email: token.email,
        },
      });
      token.isAdmin = userInDb?.isAdmin ?? false;
      return token;
    },
  },
};

export const getAuthSession = () => getServerSession(authOptions);
