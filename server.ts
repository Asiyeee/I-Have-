import express from "express";
import { createServer as createViteServer } from "vite";
import db from "./database.ts";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  
  // 1. Get Entities (for the UI to show who is talking)
  app.get("/api/entities", (req, res) => {
    const entities = db.prepare("SELECT * FROM entities").all();
    res.json(entities);
  });

  // 2. Chat Endpoint
  app.post("/api/chat", async (req, res) => {
    const { message, entityId } = req.body;

    if (!message || !entityId) {
      return res.status(400).json({ error: "Message and entityId are required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing from environment.");
      return res.json({ text: "### SYSTEM ERROR\n\nAI Protocol Key (GEMINI_API_KEY) is missing. Please configure it in the Secrets panel." });
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const entity = db.prepare("SELECT * FROM entities WHERE id = ?").get(entityId) as any;
      if (!entity) return res.status(404).json({ error: "Entity not found" });

      // Use Gemini to parse the message
      const parserResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          You are a parser for the I HAVE! protocol. 
          Extract information from the following transmission sent by a ${entity.type}.
          
          Transmission: "${message}"
          
          Return a JSON object with:
          - action: "donate" (if restaurant offering food) or "request" (if charity needing food) or "other"
          - quantity: number of meals or people
          - time: any mentioned time or "tonight"
          - urgency: 1-5 (5 being most urgent, default 1)
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              action: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              time: { type: Type.STRING },
              urgency: { type: Type.NUMBER }
            },
            required: ["action", "quantity"]
          }
        }
      });

      let cleanJson = parserResponse.text || "{}";
      // Strip markdown code blocks if present
      if (cleanJson.includes("```json")) {
        cleanJson = cleanJson.split("```json")[1].split("```")[0].trim();
      } else if (cleanJson.includes("```")) {
        cleanJson = cleanJson.split("```")[1].split("```")[0].trim();
      }

      let parsed;
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        console.error("Failed to parse JSON from Gemini:", cleanJson);
        parsed = { action: "other", quantity: 0 };
      }
      
      if (parsed.action === "donate" || parsed.action === "request") {
        const type = parsed.action === "donate" ? "supply" : "demand";
        
        // Insert listing
        const insertListing = db.prepare(`
          INSERT INTO listings (entity_id, type, quantity, available_time, urgency)
          VALUES (?, ?, ?, ?, ?)
        `);
        const result = insertListing.run(entityId, type, parsed.quantity, parsed.time || "tonight", parsed.urgency || 1);
        const listingId = result.lastInsertRowid;

        // Find matches
        const oppositeType = type === "supply" ? "demand" : "supply";
        const potentialMatches = db.prepare(`
          SELECT l.*, e.name, e.lat, e.lng, e.contact
          FROM listings l
          JOIN entities e ON l.entity_id = e.id
          WHERE l.type = ? AND l.status = 'pending'
        `).all(oppositeType) as any[];

        // Simple matching algorithm: Distance + Quantity
        const matches = potentialMatches.map(m => {
          const dist = Math.sqrt(Math.pow(m.lat - entity.lat, 2) + Math.pow(m.lng - entity.lng, 2));
          const qtyDiff = Math.abs(m.quantity - parsed.quantity);
          const score = (1 / (dist + 0.01)) * 100 - qtyDiff;
          return { ...m, score };
        }).sort((a, b) => b.score - a.score);

        if (matches.length > 0) {
          const bestMatch = matches[0];
          
          // Propose match
          const insertMatch = db.prepare(`
            INSERT INTO matches (supply_id, demand_id, pickup_time)
            VALUES (?, ?, ?)
          `);
          
          const supplyId = type === "supply" ? listingId : bestMatch.id;
          const demandId = type === "demand" ? listingId : bestMatch.id;
          
          insertMatch.run(supplyId, demandId, parsed.time || "in 30 minutes");

          const responseText = type === "supply" 
            ? `**OPTIMAL MATCH DETECTED.**\n\nTarget entity **${bestMatch.name}** requires **${bestMatch.quantity}** units. Coordination window: **${parsed.time || "in 30 minutes"}**. Proceed with execution?`
            : `**SUPPLY SOURCE IDENTIFIED.**\n\nEntity **${bestMatch.name}** has **${bestMatch.quantity}** units available. Coordination window: **${parsed.time || "in 30 minutes"}**. Proceed with execution?`;

          return res.json({ 
            text: responseText,
            match: bestMatch,
            parsed
          });
        } else {
          return res.json({ 
            text: `**TRANSMISSION LOGGED.**\n\n${parsed.action === 'donate' ? 'Supply' : 'Demand'} of **${parsed.quantity}** units registered in the global ledger. Scanning for compatible entities...`,
            parsed
          });
        }
      }

      // Default AI response if not a clear donate/request
      const chatResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are the I HAVE! protocol. A ${entity.type} named ${entity.name} sent a transmission: "${message}". Respond with a professional, technical, and mission-driven tone. Encourage them to provide surplus data (if restaurant) or demand data (if charity). Use uppercase for emphasis where appropriate.`,
      });

      res.json({ text: chatResponse.text || "Transmission received. Protocol standby." });

    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
