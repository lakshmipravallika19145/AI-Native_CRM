import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { filters } = await req.json();

  const orderWhere: Record<string, unknown> = {};

  if (filters.category) {
    orderWhere.category = String(filters.category);
  }

  if (filters.daysSinceOrder) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(filters.daysSinceOrder));
    orderWhere.orderedAt = { gte: cutoff };
  }

  if (filters.minOrderAmount) {
    orderWhere.amount = { gte: Number(filters.minOrderAmount) };
  }

  const customerWhere: Record<string, unknown> = {};
  if (filters.city) {
    customerWhere.city = String(filters.city);
  }

  customerWhere.orders = { some: orderWhere };

  const customers = await prisma.customer.findMany({
    where: customerWhere,
    select: { id: true, orders: true },
  });

  const matched = filters.minOrders
    ? customers.filter(c => c.orders.length >= Number(filters.minOrders))
    : customers;

  return NextResponse.json({
    count: matched.length,
    customerIds: matched.map(c => c.id),
  });
}