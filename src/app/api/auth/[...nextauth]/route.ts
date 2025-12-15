import NextAuth from "next-auth";
import AuthentikProvider from "next-auth/providers/authentik";


export const authOptions = {
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
    async jwt({ token, user, account }) {
      if (user) token.user = user;
      return token;
    },
    async session({ session, token }) {
      session.user = token.user as any;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
