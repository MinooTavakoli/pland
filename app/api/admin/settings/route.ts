import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, getActor } from "@/lib/auth";
import { getAllSettings, setSetting } from "@/lib/admin/settings";
import { audit } from "@/lib/admin/audit";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  const settings = await getAllSettings();
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const entries = body && typeof body === "object" ? body.settings ?? body : null;
    if (!entries || typeof entries !== "object") {
      return ApiErr.badRequest(MSG.common.invalidInput);
    }

    for (const [key, value] of Object.entries(entries)) {
      if (key === "settings") continue;
      await setSetting(key, String(value));
    }

    await audit({
      req,
      ...getActor(auth.payload),
      action: "UPDATE",
      entity: "Setting",
      summary: "به‌روزرسانی تنظیمات",
      changes: entries as Record<string, unknown>,
    });

    const settings = await getAllSettings();
    return apiSuccess({ settings, message: MSG.common.updated });
  } catch (err) {
    console.error("SETTINGS UPDATE ERROR", err);
    return ApiErr.internal();
  }
}
