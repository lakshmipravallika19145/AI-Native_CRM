import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const STATUS_RANK: Record<string, number> = {
  queued: 0, sent: 1, delivered: 2, opened: 3, clicked: 4, failed: 1
};

export async function POST(req: NextRequest) {
  const { messageId, eventType, timestamp } = await req.json();
  if (!messageId || !eventType)
    return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const message = await prisma.campaignMessage.findUnique({ where: { id: messageId } });
  if (!message)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const exists = await prisma.messageEvent.findFirst({ where: { messageId, eventType } });
  if (exists) return NextResponse.json({ skipped: true });

  const shouldUpgrade =
    (STATUS_RANK[eventType] ?? 0) > (STATUS_RANK[message.status] ?? 0);

  await prisma.$transaction([
    prisma.messageEvent.create({
      data: { messageId, eventType, occurredAt: new Date(timestamp) }
    }),
    ...(shouldUpgrade
      ? [prisma.campaignMessage.update({ where: { id: messageId }, data: { status: eventType } })]
      : [])
  ]);

  return NextResponse.json({ ok: true });
}