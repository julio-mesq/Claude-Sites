import { NextResponse, type NextRequest } from "next/server";

// Barreira rápida baseada na presença do cookie; a validação real da sessão ocorre no servidor (layouts e API).
const PROTECTED = ["/app", "/onboarding", "/admin"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has("fl_session");
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`)) && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(url);
  }
  if (AUTH_PAGES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/app", req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/app/:path*", "/onboarding", "/admin/:path*", "/login", "/register"] };
