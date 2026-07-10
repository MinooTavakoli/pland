import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getUserId, requireUser, serializeBigInt } from "@/lib/auth";
import { saveUpload, UploadError } from "@/lib/integrations/storage";
import { ApiErr, apiSuccess } from "@/lib/http/api-response";
import { MSG } from "@/lib/http/messages";
import { parseFormFields } from "@/lib/http/validation";
import { paymentUploadSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const auth = await requireUser(req);
    if (!auth.ok) return auth.response;

    const userId = getUserId(auth.payload);
    const formData = await req.formData();
    const parsed = parseFormFields(paymentUploadSchema, formData, MSG.order.idRequired);
    if (!parsed.ok) return parsed.response;

    const { orderId } = parsed.data;
    const receipt = formData.get("receipt");
    const trackingNumber = (formData.get("trackingNumber") as string) || null;
    const description = (formData.get("description") as string) || null;

    if (!(receipt instanceof File)) return ApiErr.badRequest(MSG.payment.receiptRequired);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { tx: true },
    });
    if (!order) return ApiErr.notFound(MSG.order.notFound);
    if (order.userId !== userId) return ApiErr.forbidden();
    if (order.status !== "PENDING" && order.status !== "FAILED") {
      return ApiErr.conflict(MSG.order.alreadyPaid);
    }

    const saved = await saveUpload(receipt, "receipts", { allowDocs: true });

    const tx = await prisma.transaction.update({
      where: { orderId },
      data: {
        method: "MANUAL",
        receiptUrl: saved.url,
        refId: trackingNumber,
        description,
        status: "PENDING",
      },
    });

    return apiSuccess({
      message: MSG.order.paymentUploaded,
      tx: serializeBigInt(tx),
    });
  } catch (err) {
    if (err instanceof UploadError) return ApiErr.unprocessable(err.message);
    console.error("PAYMENT UPLOAD ERROR", err);
    return ApiErr.internal();
  }
}
