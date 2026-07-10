import { NextResponse } from "next/server";

function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "bigint" ? v.toString() : String(v);
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Builds a CSV string from headers + rows. A UTF-8 BOM is prepended so Excel
 * renders Persian text correctly (covers the "Excel / CSV" export need).
 */
export function toCsv(headers: string[], rows: unknown[][]): string {
  const head = headers.map(escapeCell).join(",");
  const body = rows.map((r) => r.map(escapeCell).join(",")).join("\n");
  return `\uFEFF${head}\n${body}`;
}

export function csvResponse(filename: string, csv: string): NextResponse {
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
