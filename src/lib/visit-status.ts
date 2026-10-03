export const VISIT_STATUS = {
  DILAYANI: { label: "Diperiksa", tone: "neutral" },
  MENUNGGU_BAYAR: { label: "Di kasir", tone: "warning" },
  SELESAI: { label: "Selesai", tone: "success" },
  BATAL: { label: "Batal", tone: "danger" },
} as const;
