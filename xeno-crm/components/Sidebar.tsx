"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const links = [
  {
    href: "/",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    label: "Overview",
  },
  {
    href: "/customers",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="9" cy="7" r="4"/><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
      </svg>
    ),
    label: "Customers",
  },
  {
    href: "/campaigns",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
      </svg>
    ),
    label: "Campaigns",
  },
  {
    href: "/chat",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    label: "AI Chat",
    badge: "AI",
  },
  {
    href: "/history",
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    label: "History",
  },
];

export default function Sidebar() {
  const path = usePathname();
  const [customerCount, setCustomerCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/customers?page=1")
      .then(r => r.json())
      .then(d => setCustomerCount(d.total))
      .catch(() => setCustomerCount(null));
  }, []);

  return (
    <aside style={{
      width: 220,
      background: "#ffffff",
      borderRight: "1px solid #f0f0ee",
      display: "flex",
      flexDirection: "column",
      padding: "0",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #f0f0ee" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "#1a1a1a", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: 14, fontWeight: 600 }}>L</span>
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Lumé</p>
            <p style={{ fontSize: 11, color: "#999", margin: 0 }}>Marketing CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: "12px 12px", flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#bbb", textTransform: "uppercase", letterSpacing: 1, padding: "4px 8px 8px" }}>
          Navigation
        </p>
        {links.map(l => {
          const active = path === l.href;
          return (
            <Link key={l.href} href={l.href} style={{ textDecoration: "none" }}>
              <div style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 10px", borderRadius: 8, marginBottom: 2,
                background: active ? "#1a1a1a" : "transparent",
                color: active ? "white" : "#555",
                transition: "all 0.15s",
                cursor: "pointer",
              }}
              onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "#f5f5f3"; }}
              onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <span style={{ color: active ? "white" : "#888", display: "flex" }}>{l.icon}</span>
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 400, flex: 1 }}>{l.label}</span>
                {l.badge && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 6px",
                    borderRadius: 20, letterSpacing: 0.5,
                    background: active ? "rgba(255,255,255,0.2)" : "#f0f0ee",
                    color: active ? "white" : "#888",
                  }}>
                    {l.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom brand card */}
      <div style={{ padding: "12px 12px 16px" }}>
        <div style={{
          background: "#f8f8f6", borderRadius: 10,
          padding: "12px 14px", border: "1px solid #f0f0ee"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: "linear-gradient(135deg, #667eea, #764ba2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "white", fontSize: 11, fontWeight: 700 }}>LS</span>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>Lumé Skincare</p>
              <p style={{ fontSize: 10, color: "#999", margin: 0 }}>AI-Native CRM</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{
              flex: 1, background: "white", borderRadius: 6,
              padding: "6px 8px", border: "1px solid #f0f0ee",
              textAlign: "center"
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>
                {customerCount !== null ? customerCount.toLocaleString() : "—"}
              </p>
              <p style={{ fontSize: 9, color: "#999", margin: 0 }}>Customers</p>
            </div>
            <div style={{
              flex: 1, background: "white", borderRadius: 6,
              padding: "6px 8px", border: "1px solid #f0f0ee",
              textAlign: "center"
            }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#764ba2", margin: 0 }}>AI</p>
              <p style={{ fontSize: 9, color: "#999", margin: 0 }}>Powered</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}