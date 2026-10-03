"use server";

import { cookies } from "next/headers";

export async function flash(message: string) {
  (await cookies()).set("flash", `${Date.now()}|${encodeURIComponent(message)}`, { maxAge: 30, path: "/" });
}
