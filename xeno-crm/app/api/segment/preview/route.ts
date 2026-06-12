import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { filters } = await req.json();

  const customers = await prisma.customer.findMany({
    where: filters.city ? { city: filters.city } : {},
    include: { orders: true }
  });

  const matched = customers.filter(c => {
    const orders = c.orders;
    if (!orders.length) return false;
    if (filters.minOrders && orders.length < filters.minOrders) return false;
    if (filters.category && !orders.some((o: {category: string}) => o.category === filters.category)) return false;
    if (filters.minOrderAmount && !orders.some((o: {amount: number}) => o.amount >= filters.minOrderAmount)) return false;
    if (filters.daysSinceLastOrder) {
      const last = new Date(Math.max(...orders.map((o: {orderedAt: Date}) => new Date(o.orderedAt).getTime())));
      const days = (Date.now() - last.getTime()) / 86400000;
      if (days > filters.daysSinceLastOrder) return false;
    }
    return true;
  });

  return NextResponse.json({
    count: matched.length,
    customerIds: matched.map(c => c.id)
  });
}