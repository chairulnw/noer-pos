import { requireUser } from "@/lib/require-role";

export default async function HomePage() {
  const user = await requireUser();

  return (
    <div className="space-y-1">
      <h1 className="text-[22px] font-semibold">Beranda</h1>
      <p className="text-sm text-muted-foreground">Halo, {user.name}.</p>
    </div>
  );
}
