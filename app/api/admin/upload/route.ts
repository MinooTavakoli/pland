import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { HTTP, MSG } from "@/lib/http/messages";
import { saveUploads, StorageFolder, UploadError } from "@/lib/integrations/storage";

export const runtime = "nodejs";

const ALLOWED_FOLDERS: StorageFolder[] = [
  "products",
  "categories",
  "bags",
  "banners",
  "campaigns",
  "blog",
  "badges",
  "misc",
];

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const form = await req.formData();
    const folderParam = (form.get("folder") as string) || "misc";
    const folder = (ALLOWED_FOLDERS.includes(folderParam as StorageFolder)
      ? folderParam
      : "misc") as StorageFolder;

    const files = form
      .getAll("files")
      .concat(form.getAll("file"))
      .filter((f): f is File => f instanceof File);

    if (!files.length) return ApiErr.badRequest(MSG.common.noFile);

    const urls = await saveUploads(files, folder);
    return apiSuccess({ message: MSG.upload.success, urls }, HTTP.CREATED);
  } catch (err) {
    if (err instanceof UploadError) {
      return ApiErr.unprocessable(err.message);
    }
    console.error("ADMIN UPLOAD ERROR", err);
    return ApiErr.internal();
  }
}
