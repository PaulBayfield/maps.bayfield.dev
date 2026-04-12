import NextAuth, { type NextAuthOptions } from "next-auth";
import AuthentikProvider from "next-auth/providers/authentik";

const cookiePrefix = (process.env.COOKIE_PREFIX ?? "app").replace(/\./g, "-");
const secure = process.env.NODE_ENV === "production";

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
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}.session-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure },
    },
    callbackUrl: {
      name: `${cookiePrefix}.callback-url`,
      options: { sameSite: "lax", path: "/", secure },
    },
    csrfToken: {
      name: `${cookiePrefix}.csrf-token`,
      options: { httpOnly: true, sameSite: "lax", path: "/", secure },
    },
  },
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
