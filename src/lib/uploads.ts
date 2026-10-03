import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const dir = () => /* turbopackIgnore: true */ (process.env.UPLOAD_DIR ?? "./uploads").replace(/\/+$/, "");
const target = (name: string) => `${dir()}/${name.replace(/[^\w.-]/g, "")}`;

export async function storeFile(data: Buffer, ext: string) {
  const name = `${randomUUID()}.${ext}`;
  await mkdir(dir(), { recursive: true });
  await writeFile(target(name), data);
  return name;
}

export const readStoredFile = (name: string) => readFile(target(name));
