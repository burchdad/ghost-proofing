import { NextRequest, NextResponse } from "next/server";

const platformHosts = new Set([
  "localhost",
  "127.0.0.1",
  "ghost-proofing.vercel.app",
  "ghostphotos.com",
  "www.ghostphotos.com",
]);

function hostWithoutPort(host: string | null) {
  return (host ?? "").split(":")[0].toLowerCase();
}

function isPlatformHost(host: string) {
  return platformHosts.has(host) || host.endsWith(".vercel.app");
}

export function proxy(request: NextRequest) {
  const host = hostWithoutPort(request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  const pathname = request.nextUrl.pathname;

  if (!host || isPlatformHost(host) || pathname !== "/") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = "/portal";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};
