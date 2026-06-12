"use client";
import { useEffect, useState } from "react";
import EmptyState from "@/components/EmptyState";

type Customer = {
  id: string; name: string; email: string;
  phone: string; city: string; createdAt: string;
  _count: { orders: number };
};

const CITIES = ["All","Mumbai","Delhi","Bangalore","Hyderabad","Chennai","Pune","Kolkata","Ahmedabad","Jaipur","Surat"];

function Avatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const colors = ["#667eea","#764ba2","#f59e0b","#22c55e","#ef4444","#06b6d4","#ec4899"];
  const color  = colors[name.charCodeAt(0) % colors.length];
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%", background: color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0,
    }}>{initials}</div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [pages, setPages]         = useState(1);
  const [city, setCity]           = useState("All");
  const [search, setSearch]       = useState("");
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (city !== "All") params.set("city", city);
    fetch(`/api/customers?${params}`)
      .then(r => r.json())
      .then(d => { setCustomers(d.customers); setTotal(d.total); setPages(d.pages); })
      .finally(() => setLoading(false));
  }, [page, city]);

  const filtered = search
    ? customers.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()))
    : customers;

  return (
    <div style={{ padding: "32px 36px" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Customers</h1>
        <p style={{ fontSize: 14, color: "#999", margin: "4px 0 0" }}>
          {total.toLocaleString()} customers in your database
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#bbb" }}
            width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customers..."
            style={{
              width: "100%", paddingLeft: 36, paddingRight: 14,
              height: 38, border: "1px solid #f0f0ee", borderRadius: 10,
              fontSize: 13, background: "white", outline: "none", color: "#1a1a1a"
            }}
          />
        </div>
        <select
          value={city}
          onChange={e => { setCity(e.target.value); setPage(1); }}
          style={{
            height: 38, border: "1px solid #f0f0ee", borderRadius: 10,
            padding: "0 14px", fontSize: 13, background: "white",
            color: "#555", outline: "none", cursor: "pointer"
          }}
        >
          {CITIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 14, border: "1px solid #f0f0ee", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#fafafa", borderBottom: "1px solid #f0f0ee" }}>
              {["Customer","Email","City","Orders","Joined"].map(h => (
                <th key={h} style={{
                  textAlign: "left", padding: "12px 18px",
                  fontSize: 11, fontWeight: 600, color: "#bbb",
                  textTransform: "uppercase", letterSpacing: 0.8
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length: 5}).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #f5f5f3" }}>
                  {Array.from({length: 5}).map((_, j) => (
                    <td key={j} style={{ padding: "14px 18px" }}>
                      <div style={{ height: 14, background: "#f5f5f3", borderRadius: 6, width: j===0?"140px":"80px" }}/>
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={search ? "🔍" : "👥"}
                    title={search ? "No customers found" : "No customers yet"}
                    description={search
                      ? `No results for "${search}". Try a different name or email.`
                      : "Your customer database is empty. Run the seed script to populate sample data."}
                  />
                </td>
              </tr>
            ) : filtered.map((c, i) => (
              <tr key={c.id} style={{
                borderBottom: i < filtered.length-1 ? "1px solid #f5f5f3" : "none",
                transition: "background 0.1s"
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}
              >
                <td style={{ padding: "12px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={c.name}/>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 18px", fontSize: 13, color: "#777" }}>{c.email}</td>
                <td style={{ padding: "12px 18px" }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 20,
                    background: "#f8f8f6", color: "#666", border: "1px solid #f0f0ee"
                  }}>{c.city}</span>
                </td>
                <td style={{ padding: "12px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: 6,
                      background: "#f0f0ff", display: "flex",
                      alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: "#667eea"
                    }}>
                      {c._count.orders}
                    </div>
                    <span style={{ fontSize: 12, color: "#bbb" }}>orders</span>
                  </div>
                </td>
                <td style={{ padding: "12px 18px", fontSize: 12, color: "#bbb" }}>
                  {new Date(c.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        <div style={{
          padding: "14px 20px", borderTop: "1px solid #f5f5f3",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <p style={{ fontSize: 13, color: "#bbb", margin: 0 }}>
            Page {page} of {pages} · {total.toLocaleString()} customers
          </p>
          <div style={{ display: "flex", gap: 6 }}>
            {[
              { label: "← Prev", action: () => setPage(p => Math.max(1, p-1)), disabled: page === 1 },
              { label: "Next →", action: () => setPage(p => Math.min(pages, p+1)), disabled: page === pages },
            ].map(btn => (
              <button key={btn.label} onClick={btn.action} disabled={btn.disabled} style={{
                padding: "7px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                border: "1px solid #f0f0ee", background: "white", color: btn.disabled ? "#ddd" : "#555",
                cursor: btn.disabled ? "not-allowed" : "pointer", transition: "all 0.15s"
              }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}