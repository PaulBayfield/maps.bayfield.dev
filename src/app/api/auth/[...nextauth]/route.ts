import NextAuth, { type NextAuthOptions } from "next-auth";
import AuthentikProvider from "next-auth/providers/authentik";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  providers: [
    AuthentikProvider({
      id: "maps",
      name: "Authentik",
      issuer: process.env.AUTHENTIK_ISSUER!,
      clientId: process.env.AUTHENTIK_CLIENT_ID!,
      clientSecret: process.env.AUTHENTIK_CLIENT_SECRET!,
      authorization: { params: { scope: "openid profile email" } },
    }),
  ],
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as typeof session.user;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
