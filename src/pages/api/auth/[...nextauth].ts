import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

import { backendUrl } from '@/config/constant';

export const authOptions: NextAuthOptions = {
  callbacks: {
    async session({ session, token }: any) {
      if (token.id) {
        session.user.token = token.id;
        session.user.email = token.email;
        session.user.active = token.active;
        session.user.email_verified = token.email_verified;
        session.user.can_create_orgs = token.can_create_orgs;
      }
      // Send properties to the client, like an access_token and user id from a provider.
      return session;
    },
    async jwt({ token, user }: any) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (user?.token) {
        token.id = user.token;
        token.email = user.email;
        token.active = user.active;
        token.email_verified = user.email_verified;
        token.can_create_orgs = user.can_create_orgs;
      }
      return token;
    },
  },
  // Configure one or more authentication providers
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: 'Credentials',
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async authorize(credentials, req) {
        // Add logic here to look up the user from the credentials supplied
        const { username, password } = credentials as any;
        const res = await fetch(`${backendUrl}/api/login/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        });

        if (res.ok) {
          const user = await res.json();
          // Any object returned will be saved in `user` property of the JWT
          return user;
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
          const errorRes = await res.json();
          const error: any = new Error(errorRes?.detail || 'Please check your credentials');
          error.status = res.status;
          throw error;
        }
      },
    }),
    CredentialsProvider({
      id: 'embed-token',
      name: 'Embed Token',
      credentials: {
        token: { label: 'Token', type: 'text' },
        orgSlug: { label: 'Organization', type: 'text' },
      },
      async authorize(credentials, req) {
        if (!credentials?.token) return null;

        // Use your existing API to fetch current user details
        const headers: Record<string, string> = {
          Authorization: `Bearer ${credentials.token}`,
          'Content-Type': 'application/json',
        };

        // Add organization header if available
        if (credentials.orgSlug) {
          headers['x-dalgo-org'] = credentials.orgSlug;
        }

        const res = await fetch(`${backendUrl}/api/login_token/`, {
          method: 'POST',
          headers,
        });

        if (res.ok) {
          const user = await res.json();
          // Return user object that will be stored in the session
          // Make sure this matches the structure your app expects
          return user;
        } else {
          const errorRes = await res.json();
          const error: any = new Error(errorRes?.detail || 'Please check your credentials');
          error.status = res.status;
          console.error('Token validation failed:', error);
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
};

export default NextAuth(authOptions);
