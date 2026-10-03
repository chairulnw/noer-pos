import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";
import { userCreateSchema } from "../src/lib/user-schema";

async function main() {
  const parsed = userCreateSchema.safeParse({
    name: process.env.ADMIN_NAME,
    username: process.env.ADMIN_USERNAME,
    role: "ADMIN",
    password: process.env.ADMIN_PASSWORD,
  });
  if (!parsed.success) {
    console.error("ADMIN_NAME, ADMIN_USERNAME, ADMIN_PASSWORD wajib valid (password min. 8 karakter).");
    process.exit(1);
  }
  const { name, username, password } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { username } });
  if (exists) {
    console.error(`Username "${username}" sudah ada.`);
    process.exit(1);
  }
  await prisma.user.create({ data: { name, username, role: "ADMIN", passwordHash: await bcrypt.hash(password, 10) } });
  console.log(`Admin "${username}" dibuat.`);
}

main().finally(() => prisma.$disconnect());
