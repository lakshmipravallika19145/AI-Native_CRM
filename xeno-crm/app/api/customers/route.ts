import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Number(searchParams.get("page") || 1);
  const city = searchParams.get("city") || undefined;
  const take = 20;

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: city ? { city } : {},
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * take,
      take,
    }),
    prisma.customer.count({ where: city ? { city } : {} })
  ]);

  return NextResponse.json({ customers, total, pages: Math.ceil(total / take) });
}