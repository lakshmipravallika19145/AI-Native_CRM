"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Message = { role: "user" | "assistant"; content: string };
type SegmentData = { description: string; filters: Record<string, unknown> };
type PendingCampaign = {
  segmentData: SegmentData;
  audienceCount: number;
  customerIds: string[];
  messageTemplate: string;
};

const SUGGESTED_PROMPTS = [
  "Reach Mumbai customers who bought serum in the last 30 days — offer 20% off",
  "Target Bangalore buyers inactive for 60 days with a comeback offer",
  "Send a sunscreen reminder to Delhi customers before summer",
];

function AssistantAvatar() {
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
      background: "linear-gradient(135deg, #667eea, #764ba2)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <span style={{ color: "white", fontSize: 13, fontWeight: 700 }}>L</span>
    </div>
  );
}

function formatContent(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*")
      ? <em key={i} style={{ fontStyle: "italic", color: "#555" }}>{part.slice(1, -1)}</em>
      : part
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hi! I'm your AI marketing assistant for Lumé 🌿\n\nTell me who you want to reach and what you want to say — I'll build the segment, draft the message, and launch the campaign for you.",
  }]);
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [pending, setPending]     = useState<PendingCampaign | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchedId, setLaunchedId] = useState<string | null>(null);
  const bottomRef                 = useRef<HTMLDivElement>(null);

  const showPrompts = messages.length === 1 && !loading && !pending;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, pending]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    const userMsg: Message = { role: "user", content: msg };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput("");
    setLoading(true);
    setLaunchedId(null);

    try {
      const res  = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();

      setMessages(prev => [...prev, { role: "assistant", content: data.content }]);

      if (data.segmentData && data.audienceCount !== null) {
        const preview = await fetch("/api/segment/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filters: data.segmentData.filters }),
        });
        const previewData = await preview.json();

        const msgMatch = data.content.match(/(?:message:|draft:|here'?s?.*message.*:?\n)(.*{{name}}.*)/i);
        const template = msgMatch ? msgMatch[1].trim() : "Hi {{name}}, we have something special for you from Lumé! 🌿";

        setPending({
          segmentData:     data.segmentData,
          audienceCount:   data.audienceCount,
          customerIds:     previewData.customerIds,
          messageTemplate: template,
        });
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  async function launch() {
    if (!pending) return;
    setLaunching(true);
    const count = pending.audienceCount;
    try {
      const campRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:            `Campaign — ${pending.segmentData.description}`,
          segmentQuery:    pending.segmentData.filters,
          messageTemplate: pending.messageTemplate,
          channel:         "whatsapp",
          customerIds:     pending.customerIds,
        }),
      });
      const campaign = await campRes.json();

      await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId: campaign.id }),
      });

      setLaunchedId(campaign.id);
      setPending(null);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `✅ Campaign launched to ${count.toLocaleString()} customers! Messages are being delivered now.`,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Failed to launch campaign. Please try again." }]);
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, background: "#f8f8f6" }}>
      {/* Header */}
      <div style={{
        background: "white", borderBottom: "1px solid #f0f0ee",
        padding: "20px 36px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12,
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontSize: 18 }}>✦</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>AI Campaign Assistant</h1>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 20,
                background: "#f0f0ff", color: "#667eea", letterSpacing: 0.5,
              }}>AI</span>
            </div>
            <p style={{ fontSize: 13, color: "#999", margin: "2px 0 0" }}>
              Describe your audience in plain language — I'll handle the rest
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 36px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              display: "flex", gap: 10,
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              alignItems: "flex-end",
            }}>
              {m.role === "assistant" && <AssistantAvatar />}
              <div style={{
                maxWidth: "75%", padding: "12px 16px", fontSize: 14, lineHeight: 1.6,
                borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                background: m.role === "user" ? "#1a1a1a" : "white",
                color: m.role === "user" ? "white" : "#333",
                border: m.role === "user" ? "none" : "1px solid #f0f0ee",
                whiteSpace: "pre-wrap",
              }}>
                {m.role === "assistant" ? formatContent(m.content) : m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
              <AssistantAvatar />
              <div style={{
                background: "white", border: "1px solid #f0f0ee",
                borderRadius: "16px 16px 16px 4px", padding: "14px 18px",
                display: "flex", gap: 5, alignItems: "center",
              }}>
                <span className="chat-dot" style={{ animationDelay: "0ms" }} />
                <span className="chat-dot" style={{ animationDelay: "150ms" }} />
                <span className="chat-dot" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}

          {pending && (
            <div style={{
              background: "white", border: "1px solid #f0f0ee",
              borderRadius: 14, padding: "20px 22px", maxWidth: 520,
              marginLeft: 42, boxShadow: "0 2px 12px rgba(102,126,234,0.08)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>🚀</span>
                <p style={{ fontSize: 15, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>Ready to launch</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                <div style={{ background: "#f8f8f6", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0ee" }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#bbb", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>Audience</p>
                  <p style={{ fontSize: 26, fontWeight: 800, color: "#667eea", margin: 0, lineHeight: 1 }}>{pending.audienceCount.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>{pending.segmentData.description}</p>
                </div>
                <div style={{ background: "#f8f8f6", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0ee" }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#bbb", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 0.8 }}>Channel</p>
                  <p style={{ fontSize: 18, fontWeight: 700, color: "#1a1a1a", margin: 0 }}>💬 WhatsApp</p>
                  <p style={{ fontSize: 11, color: "#aaa", margin: "4px 0 0" }}>Personalized with {"{{name}}"}</p>
                </div>
              </div>
              <div style={{ background: "#f8f8f6", borderRadius: 10, padding: "12px 14px", border: "1px solid #f0f0ee", marginBottom: 16 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: "#bbb", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 0.8 }}>Message preview</p>
                <p style={{ fontSize: 13, color: "#555", margin: 0, lineHeight: 1.5 }}>{pending.messageTemplate}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={launch} disabled={launching} style={{
                  flex: 1, background: "#1a1a1a", color: "white", border: "none",
                  padding: "11px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  cursor: launching ? "not-allowed" : "pointer", opacity: launching ? 0.6 : 1,
                }}>
                  {launching ? "Launching..." : `Launch to ${pending.audienceCount.toLocaleString()} customers`}
                </button>
                <button onClick={() => setPending(null)} style={{
                  border: "1px solid #f0f0ee", background: "white", color: "#666",
                  padding: "11px 16px", borderRadius: 10, fontSize: 13, cursor: "pointer",
                }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {launchedId && (
            <div style={{ marginLeft: 42 }}>
              <Link href="/campaigns" style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                background: "#f0f0ff", color: "#667eea", textDecoration: "none",
                padding: "10px 18px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                border: "1px solid #e0e0ff",
              }}>
                View campaign stats →
              </Link>
            </div>
          )}

          {showPrompts && (
            <div style={{ marginLeft: 42, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#bbb", margin: "4px 0 0", textTransform: "uppercase", letterSpacing: 0.8 }}>
                Try asking
              </p>
              {SUGGESTED_PROMPTS.map(prompt => (
                <button key={prompt} onClick={() => send(prompt)} style={{
                  textAlign: "left", background: "white", border: "1px solid #f0f0ee",
                  borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#555",
                  cursor: "pointer", lineHeight: 1.4, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#667eea"; e.currentTarget.style.color = "#1a1a1a"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#f0f0ee"; e.currentTarget.style.color = "#555"; }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{
        background: "white", borderTop: "1px solid #f0f0ee",
        padding: "16px 36px 20px", flexShrink: 0,
      }}>
        <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
            placeholder="Describe your audience and offer..."
            style={{
              flex: 1, height: 44, border: "1px solid #f0f0ee", borderRadius: 12,
              padding: "0 16px", fontSize: 14, background: "#fafafa",
              outline: "none", color: "#1a1a1a",
            }}
            onFocus={e => { e.currentTarget.style.borderColor = "#667eea"; e.currentTarget.style.background = "white"; }}
            onBlur={e => { e.currentTarget.style.borderColor = "#f0f0ee"; e.currentTarget.style.background = "#fafafa"; }}
          />
          <button onClick={() => send()} disabled={loading || !input.trim()} style={{
            background: "#1a1a1a", color: "white", border: "none",
            padding: "0 22px", borderRadius: 12, fontSize: 13, fontWeight: 600,
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            opacity: loading || !input.trim() ? 0.4 : 1,
          }}>
            Send
          </button>
        </div>
        <p style={{ fontSize: 11, color: "#ccc", margin: "8px 0 0", maxWidth: 760, marginLeft: "auto", marginRight: "auto" }}>
          Press Enter to send · Powered by Llama 3.3 via Groq
        </p>
      </div>
    </div>
  );
}
