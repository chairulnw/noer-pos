import { expect, it } from "vitest";
import { passwordChangeSchema, userCreateSchema } from "./user-schema";

const base = { name: "Rina", username: " Rina.K ", role: "KASIR", password: "rahasia123" };

it("username dinormalkan huruf kecil dan divalidasi", () => {
  expect(userCreateSchema.parse(base).username).toBe("rina.k");
  expect(userCreateSchema.safeParse({ ...base, username: "a b" }).success).toBe(false);
  expect(userCreateSchema.safeParse({ ...base, username: "ab" }).success).toBe(false);
});

it("password minimal 8 dan maksimal 72 karakter", () => {
  expect(userCreateSchema.safeParse({ ...base, password: "pendek" }).success).toBe(false);
  expect(userCreateSchema.safeParse({ ...base, password: "x".repeat(73) }).success).toBe(false);
});

it("ganti password: konfirmasi harus sama dan password baru harus berbeda", () => {
  const ok = { current: "lama-12345", next: "baru-12345", confirm: "baru-12345" };
  expect(passwordChangeSchema.safeParse(ok).success).toBe(true);
  expect(passwordChangeSchema.safeParse({ ...ok, confirm: "lain-12345" }).success).toBe(false);
  expect(passwordChangeSchema.safeParse({ ...ok, next: "lama-12345", confirm: "lama-12345" }).success).toBe(false);
});
