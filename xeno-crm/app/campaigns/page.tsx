"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";

type Campaign = {
  id: string; name: string; channel: string;
  status: string; createdAt: string; audienceCount: number;
  stats: { total: number; sent: number; delivered: number; opened: number; clicked: number; failed: number };
};

function StatBox({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div style={{ flex: 1, background: "#fafafa", borderRadius: 10, padding: "12px 14px" }}>
      <p style={{ fontSize: 11, color: "#bbb", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</p>
      <p style={{ fontSize: 22, fontWeight: 800, color, margin: 0, lineHeight: 1 }}>{value}</p>
      <div style={{ marginTop: 6, height: 3, background: "#f0f0ee", borderRadius: 99 }}>
        <div style={{ height: 3, background: color, borderRadius: 99, width: `${pct}%`, opacity: 0.6 }}/>
      </div>
      <p style={{ fontSize: 11, color: "#bbb", margin: "4px 0 0" }}>{pct}%</p>
    </div>
  );
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = () => {
    fetch("/api/campaigns").then(r => r.json()).then(d => {
      setCampaigns(d); setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const sending = campaigns.some(c => c.status === "sending");
    if (!sending) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [campaigns]);

  const pct = (a: number, b: number) => b > 0 ? Math.round((a/b)*100) : 0;

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Campaigns</h1>
          <p style={{ fontSize: 14, color: "#999", margin: "4px 0 0" }}>
            {campaigns.length} campaign{campaigns.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <Link href="/chat" style={{
          background: "#1a1a1a", color: "white", textDecoration: "none",
          padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span>✦</span> New Campaign
        </Link>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[1,2].map(i => (
            <div key={i} style={{ background: "white", borderRadius: 14, padding: 24, border: "1px solid #f0f0ee", height: 140 }}/>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div style={{
          background: "white", borderRadius: 14, border: "1px solid #f0f0ee",
        }}>
          <EmptyState
            icon="📣"
            title="No campaigns yet"
            description="Describe your audience in plain language — the AI will build the segment, draft the message, and launch it for you."
            actionLabel="Start with AI →"
            actionHref="/chat"
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {campaigns.map(c => (
            <div key={c.id} style={{
              background: "white", borderRadius: 14, padding: "22px 24px",
              border: "1px solid #f0f0ee",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div style={{ flex: 1, minWidth: 0, marginRight: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.name}
                    </h3>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                      background: c.status === "sent" ? "#f0fdf4" : c.status === "sending" ? "#eff6ff" : "#f5f5f3",
                      color: c.status === "sent" ? "#16a34a" : c.status === "sending" ? "#2563eb" : "#999",
                    }}>
                      {c.status === "sending" ? "⟳ Sending..." : c.status === "sent" ? "✓ Sent" : c.status}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{
                      fontSize: 11, padding: "2px 8px", borderRadius: 6,
                      background: "#f0fff4", color: "#16a34a", fontWeight: 600
                    }}>
                      {c.channel === "whatsapp" ? "💬 WhatsApp" : c.channel}
                    </span>
                    <span style={{ fontSize: 12, color: "#bbb" }}>
                      {c.audienceCount} recipients
                    </span>
                    <span style={{ fontSize: 12, color: "#bbb" }}>
                      {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <StatBox label="Delivered" value={c.stats.delivered} pct={pct(c.stats.delivered, c.stats.total)}    color="#667eea"/>
                <StatBox label="Opened"    value={c.stats.opened}    pct={pct(c.stats.opened, c.stats.delivered)}   color="#764ba2"/>
                <StatBox label="Clicked"   value={c.stats.clicked}   pct={pct(c.stats.clicked, c.stats.opened)}     color="#22c55e"/>
                <StatBox label="Failed"    value={c.stats.failed}    pct={pct(c.stats.failed, c.stats.total)}       color="#ef4444"/>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}