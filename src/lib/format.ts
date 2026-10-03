export function formatRupiah(amount: number) {
  const abs = Math.abs(amount).toLocaleString("id-ID");
  return amount < 0 ? `-Rp ${abs}` : `Rp ${abs}`;
}

export const formatDate = (date: Date) =>
  date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export const formatTime = (date: Date) =>
  date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });
