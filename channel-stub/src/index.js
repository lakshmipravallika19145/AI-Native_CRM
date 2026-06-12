const express = require("express");
const cors    = require("cors");
const axios   = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const CRM_URL = process.env.CRM_URL || "http://localhost:3000";

const DELIVERY_OUTCOMES = [
  { event: "delivered", weight: 82 },
  { event: "failed",    weight: 18 },
];

const ENGAGEMENT = {
  delivered: [
    { event: "opened",  chance: 0.58, delay: 4000 },
    { event: "clicked", chance: 0.22, delay: 9000 },
  ],
};

function pickWeighted(outcomes) {
  const total = outcomes.reduce((s, o) => s + o.weight, 0);
  let r = Math.random() * total;
  for (const o of outcomes) { r -= o.weight; if (r <= 0) return o.event; }
  return outcomes[0].event;
}

async function callback(messageId, eventType) {
  const url = `${CRM_URL}/api/receipt/callback`;
  try {
    await axios.post(url, { messageId, eventType, timestamp: new Date().toISOString() });
    console.log(`✓ ${messageId.slice(-6)} → ${eventType}`);
  } catch {
    console.log(`✗ callback failed, retrying in 5s`);
    setTimeout(() =>
      axios.post(url, { messageId, eventType, timestamp: new Date().toISOString() }).catch(() => {}),
    5000);
  }
}

app.post("/send", (req, res) => {
  const { messageId, recipientPhone, body, channel } = req.body;
  if (!messageId) return res.status(400).json({ error: "messageId required" });

  res.json({ accepted: true, messageId });
  console.log(`📨 ${messageId.slice(-6)} via ${channel} to ${recipientPhone}`);

  const delay = Math.random() * 3000 + 1000;
  setTimeout(async () => {
    const outcome = pickWeighted(DELIVERY_OUTCOMES);
    await callback(messageId, outcome);
    for (const fu of (ENGAGEMENT[outcome] || [])) {
      if (Math.random() < fu.chance) {
        setTimeout(() => callback(messageId, fu.event), fu.delay);
      }
    }
  }, delay);
});

app.get("/health", (_, res) => res.json({ ok: true, service: "channel-stub" }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Channel stub running on :${PORT}`));