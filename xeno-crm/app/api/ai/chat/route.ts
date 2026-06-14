import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { prisma } from "@/lib/db";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are an AI marketing assistant for Lumé, a premium skincare brand in India.
You help marketers create targeted WhatsApp campaigns by understanding who they want to reach, building customer segments, drafting personalized messages, and launching campaigns.

Database has:
- customers: id, name, email, phone, city, createdAt
- orders: id, customerId, productName, category, amount, orderedAt
  - categories: serum, moisturizer, sunscreen, night-cream, toner, mask, oil, eye-care, lip-care

CONVERSATION FLOW:
1. Understand who the marketer wants to reach
2. Output a segment block AND a message block together
3. Confirm with the marketer
4. Launch

CRITICAL — When ready to define a campaign, ALWAYS output BOTH blocks together in this EXACT format:

\`\`\`segment
{
  "description": "short description of the audience",
  "filters": {
    "city": "Mumbai",
    "category": "serum",
    "minOrderAmount": 500,
    "minOrders": 1,
    "daysSinceOrder": 60
  }
}
\`\`\`

\`\`\`message
Hi {{name}}, [your personalized message here for Lumé skincare]. [Call to action]!
\`\`\`

RULES for segment filters (all optional, only include relevant ones):
- city: exact city name e.g. "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Pune", "Kolkata"
- category: product category e.g. "serum", "moisturizer", "sunscreen", "night-cream", "toner", "mask", "oil"
- daysSinceOrder: customers who placed ANY order within this many days (e.g. 30, 60, 90)
- minOrders: minimum total number of orders a customer has placed
- minOrderAmount: at least one order above this amount in rupees

RULES for message:
- ALWAYS start with "Hi {{name}},"
- Keep under 250 characters
- Make it relevant to the segment (mention the product category if filtering by one)
- End with a call to action
- NEVER use placeholders like [discount] or [offer] — write the actual offer
- Good examples:
  - "Hi {{name}}, your Lumé Vitamin C Serum is running low! Restock now and get 15% off your next order. Shop at lume.in 🌿"
  - "Hi {{name}}, we miss you! It's been a while — come back to Lumé and enjoy 20% off your next purchase. Valid this week only! 💛"
  - "Hi {{name}}, summer's here! Protect your skin with our SPF 50 Sunscreen. Order now at lume.in ☀️"

Be conversational and friendly. After showing the segment and message, ask the marketer to confirm before launching.`;

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
  const messageMatch = content.match(/```message\n([\s\S]*?)\n```/);

  let segmentData = null;
  let audienceCount = null;
  let messageTemplate = null;

  if (segmentMatch) {
    try {
      segmentData = JSON.parse(segmentMatch[1]);
      const result = await getAudienceCount(segmentData.filters);
      audienceCount = result.count;
      segmentData._audienceIds = result.ids;
    } catch {}
  }

  if (messageMatch) {
    messageTemplate = messageMatch[1].trim();
  }

  return NextResponse.json({ content, segmentData, audienceCount, messageTemplate });
}