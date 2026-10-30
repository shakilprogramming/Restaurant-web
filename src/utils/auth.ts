 import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, User, getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./connect";

 const googleClientId = process.env.GOOGLE_ID;
 const googleClientSecret = process.env.GOOGLE_SECRET;

 if (!googleClientId || !googleClientSecret) {
   throw new Error("Missing GOOGLE_ID or GOOGLE_SECRET environment variables.");
 }

 declare module "next-auth" {
   interface Session {
     user: User & {
       isAdmin: boolean;
     };
   }
 }
 declare module "next-auth/jwt" {
   interface JWT {
     isAdmin?: boolean;
   }
 }

 export const authOptions: NextAuthOptions = {
   adapter: PrismaAdapter(prisma),
   session: {
     strategy: "jwt",
   },
   providers: [
     GoogleProvider({
       clientId: googleClientId,
       clientSecret: googleClientSecret,
     }),
   ],
   callbacks: {
     async session({ session, token }) {
       const isAdmin = Boolean(token.isAdmin ?? false);
       session.user.isAdmin = isAdmin;
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
         select: {
           isAdmin: true,
         },
       });

       token.isAdmin = Boolean(userInDb?.isAdmin ?? false);
       return token;
     },
   },
 };

 export const getAuthSession = () => getServerSession(authOptions);
