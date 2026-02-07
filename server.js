const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const db = {
  guides: [
    {
      id: "g-001",
      title: "VPN Failure After Patch",
      body: "After KB-774 patch, some endpoints fail VPN handshake. Roll back patch, restart tunnel service, renew certificates, and verify split-tunnel policy propagation. If failures persist, reimage agent and reapply policy."
    },
    {
      id: "g-002",
      title: "DNS Resolution Issues",
      body: "If DNS resolution fails, check endpoint policy for DoH overrides. Flush DNS cache, reset network stack, and validate resolver allowlist. Temporary policy exception may be required."
    }
  ],
  tickets: [
    {
      id: "t-1121",
      summary: "VPN disconnects after macOS update",
      resolution: "Rollback KB-774, restart tunnel service, refresh certs.",
      success: true,
      minutesToResolve: 38
    },
    {
      id: "t-1188",
      summary: "VPN fails post endpoint patch",
      resolution: "Rollback patch, reapply split-tunnel policy.",
      success: true,
      minutesToResolve: 44
    },
    {
      id: "t-1304",
      summary: "DNS not resolving after policy update",
      resolution: "Reset network stack, remove DoH override, clear cache.",
      success: true,
      minutesToResolve: 36
    }
  ]
};

function sendJson(res, status, payload) {
  const data = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data)
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => (data += chunk));
    req.on("end", () => {
      if (!data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(err);
      }
    });
  });
}

function compress(text, max = 180) {
  if (!text) return "";
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max)}…`;
}

function searchDb(query) {
  const q = query.toLowerCase();
  const guides = db.guides.filter(g => g.title.toLowerCase().includes(q) || g.body.toLowerCase().includes(q));
  const tickets = db.tickets.filter(t => t.summary.toLowerCase().includes(q) || t.resolution.toLowerCase().includes(q));
  return { guides, tickets };
}

function buildResponse(query) {
  const { guides, tickets } = searchDb(query);
  const topGuide = guides[0];
  const successes = tickets.filter(t => t.success);
  const avg = successes.length
    ? Math.round(successes.reduce((sum, t) => sum + t.minutesToResolve, 0) / successes.length)
    : null;

  return {
    query,
    compressedGuidance: topGuide ? compress(topGuide.body) : "No matching runbook found. Escalate to tier-2.",
    similarTickets: tickets.slice(0, 3),
    avgMinutesToResolve: avg,
    confidence: tickets.length ? Math.min(0.5 + tickets.length * 0.1, 0.95) : 0.42,
    recommendedAction: tickets.length
      ? compress(tickets[0].resolution, 140)
      : "Collect logs, check endpoint policy, and open incident for review."
  };
}

function serveStatic(req, res) {
  const urlPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.join(__dirname, urlPath);
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end();
    }
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript"
    };
    res.writeHead(200, { "Content-Type": typeMap[ext] || "text/plain" });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return sendJson(res, 200, { status: "ok" });
  }

  if (req.url.startsWith("/api/")) {
    if (req.method === "POST" && req.url === "/api/ingest") {
      try {
        const body = await readBody(req);
        if (body?.guides) db.guides.push(...body.guides);
        if (body?.tickets) db.tickets.push(...body.tickets);
        return sendJson(res, 200, { ok: true, totals: { guides: db.guides.length, tickets: db.tickets.length } });
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: "Invalid JSON" });
      }
    }

    if (req.method === "POST" && req.url === "/api/search") {
      try {
        const body = await readBody(req);
        const query = body?.query || "";
        return sendJson(res, 200, buildResponse(query));
      } catch (err) {
        return sendJson(res, 400, { ok: false, error: "Invalid JSON" });
      }
    }

    res.writeHead(404);
    return res.end();
  }

  return serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
