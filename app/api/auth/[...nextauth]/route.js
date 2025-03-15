import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Export your NextAuth config as an object
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
};

// Then pass it into NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
