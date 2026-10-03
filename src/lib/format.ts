export function formatRupiah(amount: number) {
  const abs = Math.abs(amount).toLocaleString("id-ID");
  return amount < 0 ? `-Rp ${abs}` : `Rp ${abs}`;
}
