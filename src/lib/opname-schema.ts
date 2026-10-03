import { z } from "zod";

export const opnameRowSchema = z.object({
  id: z.guid(),
  counted: z.number({ error: "Isi dengan angka" }).min(0, "Minimal 0").max(10_000_000, "Terlalu besar"),
  reason: z.string().trim().max(200, "Maksimal 200 karakter"),
});

export const opnameRowsSchema = z.array(opnameRowSchema).max(2000);
export type OpnameRowInput = z.infer<typeof opnameRowSchema>;
