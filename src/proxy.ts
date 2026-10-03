import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
});

export const config = {
  // path berekstensi dikecualikan agar logo tetap termuat di halaman login
  matcher: ["/((?!api|login|forbidden|_next|.*\\..*).*)"],
};
