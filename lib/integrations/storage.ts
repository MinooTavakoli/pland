import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const DOC_TYPES = new Set(["application/pdf"]);

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const MAX_DOC_BYTES = 10 * 1024 * 1024; // 10MB

export type StorageFolder =
  | "products"
  | "categories"
  | "bags"
  | "banners"
  | "campaigns"
  | "blog"
  | "badges"
  | "receipts"
  | "misc";

export interface SaveResult {
  url: string; // public path, e.g. /uploads/products/xxx.png
  filename: string;
  size: number;
  type: string;
}

export class UploadError extends Error {
  constructor(
    message: string,
    public code: "INVALID_TYPE" | "TOO_LARGE" | "NO_FILE" = "INVALID_TYPE",
  ) {
    super(message);
  }
}

function safeExt(name: string, type: string): string {
  const ext = path.extname(name || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  if (ext) return ext;
  if (type === "application/pdf") return ".pdf";
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/gif") return ".gif";
  return ".jpg";
}

/**
 * Saves an uploaded web `File` to local server storage under public/uploads.
 * Returns the public URL to reference the file.
 */
export async function saveUpload(
  file: File,
  folder: StorageFolder = "misc",
  opts: { allowDocs?: boolean } = {},
): Promise<SaveResult> {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new UploadError("فایلی ارسال نشده است", "NO_FILE");
  }

  const type = file.type || "";
  const allowDocs = opts.allowDocs ?? false;
  const isImage = IMAGE_TYPES.has(type);
  const isDoc = allowDocs && DOC_TYPES.has(type);

  if (!isImage && !isDoc) {
    throw new UploadError("نوع فایل مجاز نیست", "INVALID_TYPE");
  }

  const maxBytes = isDoc ? MAX_DOC_BYTES : MAX_IMAGE_BYTES;
  if (file.size > maxBytes) {
    throw new UploadError("حجم فایل بیش از حد مجاز است", "TOO_LARGE");
  }

  const dir = path.join(UPLOAD_ROOT, folder);
  await mkdir(dir, { recursive: true });

  const ext = safeExt(file.name, type);
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return {
    url: `/uploads/${folder}/${filename}`,
    filename,
    size: file.size,
    type,
  };
}

/** Saves multiple uploaded files; returns their public URLs. */
export async function saveUploads(
  files: File[],
  folder: StorageFolder = "misc",
  opts: { allowDocs?: boolean } = {},
): Promise<string[]> {
  const results = await Promise.all(
    files.map((f) => saveUpload(f, folder, opts)),
  );
  return results.map((r) => r.url);
}
