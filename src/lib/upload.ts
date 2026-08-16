import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ALLOWED_UPLOAD_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validation";
import { HttpError } from "@/lib/auth";

// Stored outside public/ so a visibility-restricted attachment can't be fetched
// by guessing a static URL — the only way in is the authorized download route.
const STORAGE_ROOT = path.join(process.cwd(), "storage", "attachments");

export async function saveUpload(file: File): Promise<{
  filename: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
}> {
  if (!ALLOWED_UPLOAD_MIME_TYPES.includes(file.type)) {
    throw new HttpError(400, `Unsupported file type: ${file.type || "unknown"}`);
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new HttpError(400, `File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB limit`);
  }

  await mkdir(STORAGE_ROOT, { recursive: true });
  const storedName = `${randomUUID()}-${file.name}`;
  const storagePath = path.join(STORAGE_ROOT, storedName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, buffer);

  return {
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    storagePath,
  };
}
