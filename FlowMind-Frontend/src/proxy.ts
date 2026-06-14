import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith("/login")
  const isApiAuth = pathname.startsWith("/api/auth/")
  const isStatic =
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public/")
  if (isApiAuth || isStatic) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  })

  const isAuthenticated = !!token

  if (isAuthPage && isAuthenticated) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl")
    return NextResponse.redirect(new URL(callbackUrl || "/", request.url))
  }

  if (!isAuthPage && !isAuthenticated) {
    const signInUrl = new URL("/login", request.url)
    signInUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
