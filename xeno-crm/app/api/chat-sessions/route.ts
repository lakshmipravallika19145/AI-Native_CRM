import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const sessions = await prisma.chatSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  const { messages, summary } = await req.json();
  const session = await prisma.chatSession.create({
    data: { messages, summary }
  });
  return NextResponse.json(session);
}