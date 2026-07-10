import { NextResponse } from "next/server";
import { swaggerSpec } from "@/lib/docs/swagger";

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
