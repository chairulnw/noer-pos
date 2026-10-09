import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import type { UserCreateInput, UserUpdateInput } from "@/lib/user-schema";

const PUBLIC = { id: true, username: true, name: true, role: true, isDoctor: true, active: true } satisfies Prisma.UserSelect;

export async function pageUsers(q: string | undefined, skip: number, take: number, orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[]) {
  const term = q?.trim();
  const where: Prisma.UserWhereInput = term ? { OR: [{ name: { contains: term, mode: "insensitive" } }, { username: { contains: term, mode: "insensitive" } }] } : {};
  const [rows, total] = await Promise.all([
    prisma.user.findMany({ where, select: PUBLIC, orderBy: orderBy ?? [{ active: "desc" }, { name: "asc" }], skip, take }),
    prisma.user.count({ where }),
  ]);
  return { rows, total };
}

export const getUser = (id: string) => prisma.user.findUnique({ where: { id }, select: PUBLIC });

export async function createUser(adminId: string, input: UserCreateInput) {
  const passwordHash = await bcrypt.hash(input.password, 10);
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { username: input.username, name: input.name, role: input.role, isDoctor: input.isDoctor, passwordHash },
        select: PUBLIC,
      });
      await logAudit(tx, { userId: adminId, action: "user.create", entity: "user", entityId: user.id, after: { username: user.username, name: user.name, role: user.role, isDoctor: user.isDoctor } });
      return { id: user.id };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return { error: "Username sudah dipakai." };
    throw error;
  }
}

export async function updateUser(adminId: string, id: string, input: UserUpdateInput) {
  if (id === adminId && (!input.active || input.role !== "ADMIN")) {
    return { error: "Anda tidak bisa menonaktifkan akun sendiri atau menurunkan role sendiri." };
  }
  return prisma.$transaction(async (tx) => {
    const before = await tx.user.findUnique({ where: { id }, select: PUBLIC });
    if (!before) return { error: "Pengguna tidak ditemukan." };
    const after = await tx.user.update({ where: { id }, data: input, select: PUBLIC });
    await logAudit(tx, {
      userId: adminId,
      action: before.active !== after.active ? (after.active ? "user.activate" : "user.deactivate") : "user.update",
      entity: "user",
      entityId: id,
      before: { name: before.name, role: before.role, isDoctor: before.isDoctor, active: before.active },
      after: { name: after.name, role: after.role, isDoctor: after.isDoctor, active: after.active },
    });
    return {};
  });
}

export async function resetPassword(adminId: string, id: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.user.updateMany({ where: { id }, data: { passwordHash } });
    if (count === 0) return { error: "Pengguna tidak ditemukan." };
    await logAudit(tx, { userId: adminId, action: "user.reset_password", entity: "user", entityId: id });
    return {};
  });
}

