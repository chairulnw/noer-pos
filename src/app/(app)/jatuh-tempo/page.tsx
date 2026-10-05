import { redirect } from "next/navigation";

export default async function DueRedirect({ searchParams }: { searchParams: Promise<{ hari?: string }> }) {
  const { hari } = await searchParams;
  redirect(`/vaksin?tampilan=jatuh-tempo${hari ? `&hari=${encodeURIComponent(hari)}` : ""}`);
}
