import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const customers = await prisma.customer.findMany();

  return NextResponse.json({
    success: true,
    customers,
  });
}