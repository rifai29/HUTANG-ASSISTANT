import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/gemini/summarize", async (req, res) => {
    try {
      const { debts } = req.body;
      if (!debts) return res.status(400).json({ error: "No debts data provided" });

      const prompt = `Analisis data hutang piutang berikut dalam bahasa Indonesia yang ringkas dan bersahabat:
      ${JSON.stringify(debts)}
      
      Berikan ringkasan total hutang, total piutang, saldo bersih, dan saran keuangan singkat. 
      Format dalam Markdown.`;

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      res.json({ summary: result.text });
    } catch (error) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: "Gagal menghasilkan ringkasan AI" });
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
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
