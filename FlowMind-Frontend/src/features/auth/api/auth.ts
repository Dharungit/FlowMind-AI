import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthResponse, RefreshResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL!;

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "google" && account?.id_token) {
        try {
          const res = await fetch(`${API_URL}/v1/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
          });
          if (!res.ok) return false;
        } catch {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, account }) {
      if (account?.id_token) {
        const res = await fetch(`${API_URL}/v1/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id_token: account.id_token } satisfies {
            id_token: string;
          }),
        });

        if (!res.ok) {
          throw new Error("Backend token exchange failed");
        }

        const data: AuthResponse = await res.json();

        return {
          ...token,
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          user: data.user,
          expiresAt: Date.now() + 55 * 60 * 1000,
        };
      }

      if (
        token.expiresAt &&
        Date.now() > token.expiresAt &&
        token.refreshToken
      ) {
        try {
          const res = await fetch(`${API_URL}/v1/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              refresh_token: token.refreshToken,
            } satisfies { refresh_token: string }),
          });

          if (!res.ok) {
            throw new Error("Token refresh failed");
          }

          const data: RefreshResponse = await res.json();

          return {
            ...token,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: Date.now() + 55 * 60 * 1000,
            error: undefined,
          };
        } catch {
          return { ...token, error: "RefreshAccessTokenError" };
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token.error) {
        session.error = token.error;
      }

      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }

      if (token.refreshToken) {
        session.refreshToken = token.refreshToken;
      }

      if (token.expiresAt) {
        session.expiresAt = token.expiresAt;
      }

      if (token.user) {
        session.user = token.user;
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
};
