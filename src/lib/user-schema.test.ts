import { expect, it } from "vitest";
import { passwordResetSchema, userCreateFormSchema, userCreateSchema } from "./user-schema";

const base = { name: "Rina", username: " Rina.K ", role: "KASIR", password: "rahasia123" };

it("username dinormalkan huruf kecil dan divalidasi", () => {
  expect(userCreateSchema.parse(base).username).toBe("rina.k");
  expect(userCreateSchema.safeParse({ ...base, username: "a b" }).success).toBe(false);
  expect(userCreateSchema.safeParse({ ...base, username: "ab" }).success).toBe(false);
});

it("password minimal 10, huruf + angka, bukan password umum", () => {
  expect(userCreateSchema.safeParse({ ...base, password: "abcdefghij" }).success).toBe(false);
  expect(userCreateSchema.safeParse({ ...base, password: "Password123" }).success).toBe(false);
  expect(userCreateSchema.safeParse({ ...base, password: "pendek" }).success).toBe(false);
  expect(userCreateSchema.safeParse({ ...base, password: "x".repeat(73) }).success).toBe(false);
});

it("konfirmasi password harus sama (buat user dan reset)", () => {
  const ok = { password: "rahasia123", confirmPassword: "rahasia123" };
  const bad = { password: "rahasia123", confirmPassword: "rahasia124" };
  expect(passwordResetSchema.safeParse(ok).success).toBe(true);
  expect(passwordResetSchema.safeParse(bad).success).toBe(false);
  expect(userCreateFormSchema.safeParse({ ...base, ...ok }).success).toBe(true);
  expect(userCreateFormSchema.safeParse({ ...base, ...bad }).success).toBe(false);
});

