"use client"

import { signIn, useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern"
import { Suspense, useEffect, useState } from "react"

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { status } = useSession()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === "authenticated") {
      router.push(callbackUrl)
    }
  }, [status, callbackUrl, router])

  const handleSignIn = async () => {
    setIsLoading(true)
    await signIn("google", { callbackUrl, redirect: true })
  }

  if (status === "authenticated") {
    return null
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-background">
      <AnimatedGridPattern
        className="fill-neutral-400/20 stroke-neutral-400/20 [mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
        width={60}
        height={60}
        numSquares={30}
        maxOpacity={0.3}
        duration={3}
      />

      <div className="relative z-10 mx-auto w-full max-w-sm px-4">
        <div className="rounded-xl border border-neutral-200 bg-white/80 p-8 shadow-sm backdrop-blur-xl">
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="flex size-12 items-center justify-center rounded-xl bg-neutral-900">
              <span className="text-lg font-bold text-white">F</span>
            </div>
            <h1 className="text-xl font-semibold text-neutral-900">Sign in to FlowMind</h1>
            <p className="text-sm text-neutral-500">Continue with your Google account</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error === "OAuthAccountNotLinked"
                ? "This Google account is already linked to another sign-in method."
                : error === "AccessDenied"
                  ? "Access denied. Please contact support."
                  : "An error occurred during sign-in. Please try again."}
            </div>
          )}

          <Button
            className="w-full gap-2"
            variant="outline"
            size="lg"
            onClick={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
            ) : (
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {isLoading ? "Redirecting..." : "Sign in with Google"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-600" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
