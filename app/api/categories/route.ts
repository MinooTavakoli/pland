import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ApiErr } from "@/lib/http/api-response";

export const runtime = "nodejs";

export async function GET() {
  try {
    const all = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { id: "asc" }],
      select: {
        id: true,
        title: true,
        slug: true,
        parentId: true,
        gender: true,
        image: true,
      },
    });

    type Node = (typeof all)[number] & { children: Node[] };
    const map = new Map<number, Node>();
    all.forEach((c) => map.set(c.id, { ...c, children: [] }));

    const roots: Node[] = [];
    for (const node of map.values()) {
      if (node.parentId && map.has(node.parentId)) {
        map.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return NextResponse.json({ categories: roots });
  } catch (err) {
    console.error("CATEGORY API ERROR", err);
    return ApiErr.internal();
  }
}
