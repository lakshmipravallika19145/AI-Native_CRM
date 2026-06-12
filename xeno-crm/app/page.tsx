import { prisma } from "@/lib/db";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [totalCustomers, totalCampaigns, totalMessages] = await Promise.all([
    prisma.customer.count(),
    prisma.campaign.count(),
    prisma.campaignMessage.count(),
  ]);

  const [delivered, opened, clicked, failed] = await Promise.all([
    prisma.campaignMessage.count({ where: { status: { in: ["delivered","opened","clicked"] } } }),
    prisma.campaignMessage.count({ where: { status: { in: ["opened","clicked"] } } }),
    prisma.campaignMessage.count({ where: { status: "clicked" } }),
    prisma.campaignMessage.count({ where: { status: "failed" } }),
  ]);

  const recentCampaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: "desc" }, take: 4,
    include: { messages: { select: { status: true } } }
  });

  const cityStats = await prisma.customer.groupBy({
    by: ["city"], _count: true,
    orderBy: { _count: { city: "desc" } }, take: 5,
  });

  const categoryStats = await prisma.order.groupBy({
    by: ["category"], _count: true,
    orderBy: { _count: { category: "desc" } }, take: 5,
  });

  const dr = totalMessages > 0 ? Math.round((delivered / totalMessages) * 100) : 0;
  const or = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
  const cr = opened > 0 ? Math.round((clicked / opened) * 100) : 0;

  return (
    <div style={{ padding: "32px 36px", maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Good evening 👋</h1>
          <p style={{ fontSize: 14, color: "#999", margin: "4px 0 0" }}>
            Here's how Lumé is performing across all campaigns
          </p>
        </div>
        <Link href="/chat" style={{
          background: "#1a1a1a", color: "white", textDecoration: "none",
          padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>✦</span> New AI Campaign
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Customers", value: totalCustomers.toLocaleString(), sub: "in database", accent: "#667eea", bg: "#f0f0ff" },
          { label: "Campaigns Sent",  value: totalCampaigns.toLocaleString(), sub: "all time",    accent: "#764ba2", bg: "#f5f0ff" },
          { label: "Delivery Rate",   value: `${dr}%`,   sub: `${delivered.toLocaleString()} delivered`, accent: "#22c55e", bg: "#f0fdf4" },
          { label: "Open Rate",       value: `${or}%`,   sub: `${opened.toLocaleString()} opened`,       accent: "#f59e0b", bg: "#fffbeb" },
        ].map(s => (
          <div key={s.label} style={{
            background: "white", borderRadius: 14, padding: "20px 22px",
            border: "1px solid #f0f0ee",
          }}>
            <div style={{
              display: "inline-flex", padding: "6px 10px", borderRadius: 8,
              background: s.bg, marginBottom: 12,
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: s.accent }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 30, fontWeight: 800, color: "#1a1a1a", margin: 0, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: "#aaa", margin: "6px 0 0" }}>{s.sub}</p>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Funnel */}
        <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", border: "1px solid #f0f0ee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Engagement Funnel</h3>
            <span style={{ fontSize: 11, color: "#bbb" }}>All campaigns</span>
          </div>
          {totalMessages === 0 ? (
            <EmptyState
              icon="📊"
              title="No campaign data yet"
              description="Launch your first AI campaign to see delivery, open, and click rates here."
              actionLabel="Create with AI →"
              actionHref="/chat"
            />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "Sent",      n: totalMessages, pct: 100, color: "#e8e8e8", text: "#999"    },
                { label: "Delivered", n: delivered,     pct: dr,  color: "#667eea", text: "#667eea" },
                { label: "Opened",    n: opened,        pct: or,  color: "#764ba2", text: "#764ba2" },
                { label: "Clicked",   n: clicked,       pct: cr,  color: "#22c55e", text: "#22c55e" },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 13, color: "#555" }}>{f.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: f.text }}>
                      {f.n.toLocaleString()} <span style={{ fontWeight: 400, color: "#bbb" }}>({f.pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 6, background: "#f5f5f3", borderRadius: 99 }}>
                    <div style={{ height: 6, background: f.color, borderRadius: 99, width: `${f.pct}%`, transition: "width 0.6s ease" }}/>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top cities */}
        <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", border: "1px solid #f0f0ee" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Top Cities</h3>
            <Link href="/customers" style={{ fontSize: 12, color: "#999", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cityStats.map((c, i) => {
              const pct = Math.round((c._count / totalCustomers) * 100);
              const colors = ["#667eea","#764ba2","#f59e0b","#22c55e","#ef4444"];
              return (
                <div key={c.city}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: colors[i], display: "inline-block"
                      }}/>
                      <span style={{ fontSize: 13, color: "#555" }}>{c.city}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{c._count}</span>
                  </div>
                  <div style={{ height: 4, background: "#f5f5f3", borderRadius: 99 }}>
                    <div style={{ height: 4, background: colors[i], borderRadius: 99, width: `${pct}%`, opacity: 0.7 }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Recent campaigns */}
        <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0ee", overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f5f5f3", display: "flex", justifyContent: "space-between" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Recent Campaigns</h3>
            <Link href="/campaigns" style={{ fontSize: 12, color: "#999", textDecoration: "none" }}>View all →</Link>
          </div>
          {recentCampaigns.length === 0 ? (
            <EmptyState
              icon="📣"
              title="No campaigns yet"
              description="Use the AI assistant to build a segment and send your first WhatsApp campaign."
              actionLabel="Start with AI →"
              actionHref="/chat"
            />
          ) : recentCampaigns.map((c, i) => {
            const total = c.messages.length;
            const del   = c.messages.filter(m => ["delivered","opened","clicked"].includes(m.status)).length;
            const op    = c.messages.filter(m => ["opened","clicked"].includes(m.status)).length;
            const dr2   = total > 0 ? Math.round((del/total)*100) : 0;
            const or2   = del > 0 ? Math.round((op/del)*100) : 0;
            return (
              <div key={c.id} style={{
                padding: "14px 24px", display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: 16,
                borderBottom: i < recentCampaigns.length-1 ? "1px solid #f5f5f3" : "none"
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.name}
                  </p>
                  <p style={{ fontSize: 11, color: "#bbb", margin: "2px 0 0" }}>
                    {total} recipients · {c.channel}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#667eea", margin: 0 }}>{dr2}%</p>
                    <p style={{ fontSize: 10, color: "#bbb", margin: 0 }}>Delivered</p>
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#764ba2", margin: 0 }}>{or2}%</p>
                    <p style={{ fontSize: 10, color: "#bbb", margin: 0 }}>Opened</p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                    background: c.status === "sent" ? "#f0fdf4" : c.status === "sending" ? "#eff6ff" : "#f5f5f3",
                    color: c.status === "sent" ? "#16a34a" : c.status === "sending" ? "#2563eb" : "#999",
                  }}>
                    {c.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Top categories */}
        <div style={{ background: "white", borderRadius: 14, padding: "22px 24px", border: "1px solid #f0f0ee" }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: "0 0 18px" }}>Top Categories</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryStats.map((c, i) => {
              const icons: Record<string, string> = {
                serum: "🧴", moisturizer: "💧", sunscreen: "☀️",
                "night-cream": "🌙", toner: "✨", mask: "🎭",
                oil: "🌹", "eye-care": "👁", "lip-care": "💋"
              };
              return (
                <div key={c.category} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", background: "#f8f8f6", borderRadius: 10
                }}>
                  <span style={{ fontSize: 18 }}>{icons[c.category] || "🛍"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", margin: 0, textTransform: "capitalize" }}>
                      {c.category.replace("-", " ")}
                    </p>
                    <p style={{ fontSize: 11, color: "#bbb", margin: 0 }}>{c._count} orders</p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#667eea" }}>#{i+1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}