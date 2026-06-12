"use client";
import { useEffect, useState } from "react";

type Session = {
  id: string;
  messages: { role: string; content: string }[];
  summary: string | null;
  createdAt: string;
};

export default function HistoryPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selected, setSelected] = useState<Session | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/chat-sessions")
      .then(r => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: "32px 36px" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Chat History</h1>
        <p style={{ fontSize: 14, color: "#999", margin: "4px 0 0" }}>
          All AI campaign conversations with timestamps
        </p>
      </div>

      {loading ? (
        <div style={{ color: "#bbb", textAlign: "center", padding: 40 }}>Loading...</div>
      ) : sessions.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <p style={{ fontSize: 32, margin: "0 0 12px" }}>💬</p>
          <p style={{ color: "#bbb" }}>No chat sessions yet</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>
          {/* Session list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => setSelected(s)}
                style={{
                  background: selected?.id === s.id ? "#1a1a1a" : "white",
                  color: selected?.id === s.id ? "white" : "#1a1a1a",
                  border: "1px solid #f0f0ee",
                  borderRadius: 12, padding: "14px 16px",
                  cursor: "pointer", transition: "all 0.15s",
                }}
              >
                <p style={{
                  fontSize: 13, fontWeight: 600, margin: "0 0 4px",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                  {s.summary || "AI Chat Session"}
                </p>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    {new Date(s.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                  <span style={{ fontSize: 11, opacity: 0.6 }}>
                    {new Date(s.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: "2px 8px",
                    borderRadius: 20,
                    background: selected?.id === s.id ? "rgba(255,255,255,0.2)" : "#f0f0ee",
                    color: selected?.id === s.id ? "white" : "#888"
                  }}>
                    {(s.messages as any[]).length} msgs
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Session detail */}
          {selected ? (
            <div style={{
              background: "white", borderRadius: 14,
              border: "1px solid #f0f0ee", overflow: "hidden",
              display: "flex", flexDirection: "column"
            }}>
              <div style={{
                padding: "16px 24px", borderBottom: "1px solid #f5f5f3",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>
                    {selected.summary || "Chat Session"}
                  </p>
                  <p style={{ fontSize: 12, color: "#bbb", margin: "2px 0 0" }}>
                    {new Date(selected.createdAt).toLocaleDateString("en-IN", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric"
                    })} at {new Date(selected.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                {(selected.messages as any[]).map((m: any, i: number) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: m.role === "user" ? "flex-end" : "flex-start"
                  }}>
                    {m.role === "assistant" && (
                      <div style={{
                        width: 26, height: 26, borderRadius: "50%",
                        background: "#1a1a1a", display: "flex",
                        alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "white",
                        marginRight: 8, flexShrink: 0, marginTop: 2
                      }}>AI</div>
                    )}
                    <div style={{
                      maxWidth: "70%", padding: "10px 14px",
                      borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: m.role === "user" ? "#1a1a1a" : "#f8f8f6",
                      color: m.role === "user" ? "white" : "#1a1a1a",
                      fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap"
                    }}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              background: "white", borderRadius: 14,
              border: "1px solid #f0f0ee",
              display: "flex", alignItems: "center",
              justifyContent: "center", color: "#bbb", fontSize: 14
            }}>
              Select a session to view the conversation
            </div>
          )}
        </div>
      )}
    </div>
  );
}