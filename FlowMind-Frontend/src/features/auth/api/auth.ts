import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthResponse } from "./types";

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
    async jwt({ token, account, trigger, session }) {
      console.log("[AUTH DEBUG] jwt callback", {
        trigger,
        hasAccount: !!account,
        hasIdToken: !!account?.id_token,
        hasExpiresAt: !!token.expiresAt,
        expiresAt: token.expiresAt
          ? new Date(token.expiresAt).toISOString()
          : null,
        now: new Date().toISOString(),
        isExpired: token.expiresAt ? Date.now() > token.expiresAt : null,
        hasRefreshToken: !!token.refreshToken,
      });

      if (trigger === "update" && session) {
        console.log("[AUTH DEBUG] jwt update handler", { session });
        return {
          ...token,
          accessToken: session.accessToken ?? token.accessToken,
          refreshToken: session.refreshToken ?? token.refreshToken,
          expiresAt: session.expiresAt ?? token.expiresAt,
        };
      }

      if (account?.id_token) {
        console.log(
          "[AUTH DEBUG] jwt initial exchange - calling POST /v1/auth/google",
        );

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
          expiresAt: Date.now() + 2 * 60 * 1000,
        };
      }

      console.log("[AUTH DEBUG] jwt returning token unchanged");
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
