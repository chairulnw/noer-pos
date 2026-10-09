import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { get, put } from "@vercel/blob";

// Di Vercel disk tidak permanen: bila BLOB_READ_WRITE_TOKEN ada, file disimpan di Vercel Blob (private).
const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const dir = () => /* turbopackIgnore: true */ (process.env.UPLOAD_DIR ?? "./uploads").replace(/\/+$/, "");
const safe = (name: string) => name.replace(/[^\w.-]/g, "");
const target = (name: string) => `${dir()}/${safe(name)}`;

export async function storeFile(data: Buffer, ext: string) {
  const name = `${randomUUID()}.${ext}`;
  if (blobEnabled()) {
    await put(name, data, { access: "private", addRandomSuffix: false });
    return name;
  }
  await mkdir(dir(), { recursive: true });
  await writeFile(target(name), data);
  return name;
}

export async function readStoredFile(name: string) {
  if (!blobEnabled()) return readFile(target(name));
  const result = await get(safe(name), { access: "private" });
  if (!result || result.statusCode !== 200) throw new Error("File tidak ditemukan.");
  return Buffer.from(await new Response(result.stream).arrayBuffer());
}
