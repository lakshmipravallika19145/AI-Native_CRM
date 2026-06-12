import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { campaignId } = await req.json();

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { messages: { include: { customer: true } } }
  });
  if (!campaign)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sending" } });

  const stubUrl = process.env.CHANNEL_STUB_URL;

  // Fire all messages async
  Promise.all(
    campaign.messages.map(async (msg) => {
      await prisma.campaignMessage.update({ where: { id: msg.id }, data: { status: "sent" } });
      await fetch(`${stubUrl}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageId: msg.id,
          recipientPhone: msg.customer.phone,
          body: msg.body.replace("{{name}}", msg.customer.name),
          channel: campaign.channel,
        })
      });
    })
  ).then(async () => {
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: "sent" } });
  });

  return NextResponse.json({ ok: true, dispatched: campaign.messages.length });
}