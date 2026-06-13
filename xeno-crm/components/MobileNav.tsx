"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/",          label: "Home",      icon: "📊" },
  { href: "/customers", label: "Customers", icon: "👥" },
  { href: "/campaigns", label: "Campaigns", icon: "📣" },
  { href: "/chat",      label: "AI Chat",   icon: "🤖" },
  { href: "/history",   label: "History",   icon: "🕐" },
];

export default function MobileNav() {
  const path = usePathname();
  return (
    <nav style={{
        display: "none",
        position: "fixed",
        bottom: 0, left: 0, right: 0,
        background: "white",
        borderTop: "1px solid #f0f0ee",
        zIndex: 100,
        padding: "8px 0 12px",
      }} className="mobile-nav">
      <div style={{ display: "flex", justifyContent: "space-around" }}>
        {links.map(l => (
          <Link key={l.href} href={l.href} style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: 3,
            textDecoration: "none", padding: "4px 8px",
            opacity: path === l.href ? 1 : 0.4,
          }}>
            <span style={{ fontSize: 18 }}>{l.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#1a1a1a" }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}