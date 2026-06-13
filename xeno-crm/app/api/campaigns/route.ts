import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: { select: { status: true } }
    }
  });

  const enriched = campaigns.map(c => ({
    ...c,
    stats: {
      total:     c.messages.length,
      sent:      c.messages.filter(m => ["sent","delivered","opened","clicked","failed"].includes(m.status)).length,
      delivered: c.messages.filter(m => ["delivered","opened","clicked"].includes(m.status)).length,
      opened:    c.messages.filter(m => ["opened","clicked"].includes(m.status)).length,
      clicked:   c.messages.filter(m => m.status === "clicked").length,
      failed:    c.messages.filter(m => m.status === "failed").length,
    }
  }));

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const { name, segmentQuery, messageTemplate, channel, customerIds } = await req.json();

  const campaign = await prisma.campaign.create({
    data: {
      name,
      segmentQuery,
      messageTemplate,
      channel:      channel || "whatsapp",
      audienceCount: customerIds.length,
      messages: {
        create: customerIds.map((customerId: string) => ({
          customerId,
          body: messageTemplate,
        }))
      }
    }
  });

  return NextResponse.json(campaign);
}