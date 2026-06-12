import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an AI marketing assistant for Lumé, a premium skincare brand in India.
You help marketers create targeted campaigns by understanding who they want to reach, building customer segments, drafting personalized messages, and launching campaigns.

Database has:
- customers: id, name, email, phone, city, createdAt
- orders: id, customerId, productName, category, amount, orderedAt
  - categories: serum, moisturizer, sunscreen, night-cream, toner, mask, oil, eye-care, lip-care

CONVERSATION FLOW:
1. Understand who the marketer wants to reach
2. Output a segment block
3. Show audience count (provided to you)
4. Draft a message
5. Confirm and launch

When ready to define a segment, output EXACTLY this format:
\`\`\`segment
{
  "description": "short description",
  "filters": {
    "city": "Mumbai",
    "category": "serum",
    "minOrderAmount": 500,
    "minOrders": 1,
    "daysSinceOrder": 60
  }
}
\`\`\`
All filter fields are optional. Only include what's relevant.
- city: exact city name e.g. "Mumbai", "Delhi", "Bangalore"
- category: product category e.g. "serum", "moisturizer", "sunscreen"
- daysSinceOrder: only include customers who placed ANY order within this many days
- minOrders: minimum total number of orders
- minOrderAmount: at least one order above this amount

When drafting a message use {{name}} for personalization. Keep under 300 chars.
Be conversational, friendly, and concise.`;

async function getAudienceCount(filters: Record<string, unknown>): Promise<{ count: number; ids: string[] }> {
  // Build the order WHERE clause
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

  // Build customer WHERE clause
  const customerWhere: Record<string, unknown> = {};
  if (filters.city) {
    customerWhere.city = String(filters.city);
  }

  // Always require at least one matching order
  customerWhere.orders = { some: orderWhere };

  const customers = await prisma.customer.findMany({
    where: customerWhere,
    select: { id: true, orders: true },
  });

  // Apply minOrders filter if needed
  const filtered = filters.minOrders
    ? customers.filter(c => c.orders.length >= Number(filters.minOrders))
    : customers;

  return {
    count: filtered.length,
    ids: filtered.map(c => c.id),
  };
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    max_tokens: 1000,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || "";

  const segmentMatch = content.match(/```segment\n([\s\S]*?)\n```/);
  let segmentData = null;
  let audienceCount = null;

  if (segmentMatch) {
    try {
      segmentData = JSON.parse(segmentMatch[1]);
      const result = await getAudienceCount(segmentData.filters);
      audienceCount = result.count;
      segmentData._audienceIds = result.ids;
    } catch {}
  }

  return NextResponse.json({ content, segmentData, audienceCount });
}