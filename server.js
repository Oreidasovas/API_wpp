const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const MONGO_URI = process.env.MONGO_URI;

app.use(express.json());

// === Rota de verificação do Webhook ===
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verificado com sucesso!");
    return res.status(200).send(challenge);
  } else {
    console.warn("❌ Falha na verificação do Webhook.");
    return res.sendStatus(403);
  }
});

// === Rota para receber mensagens reais ===
app.post("/webhook", async (req, res) => {
  const entry = req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (entry) {
    const { from, text } = entry;
    const msg = text?.body || "Mensagem sem texto";

    // Enviar resposta automática
    await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: "whatsapp",
        to: from,
        text: { body: "Recebido com sucesso! Obrigado pela sua mensagem." },
      },
      { headers: { Authorization: `Bearer ${WHATSAPP_TOKEN}` } }
    );

    // Salvar no MongoDB
    try {
      const client = new MongoClient(MONGO_URI);
      await client.connect();
      const db = client.db();
      const collection = db.collection("mensagens");
      await collection.insertOne({ from, msg, date: new Date() });
      await client.close();
    } catch (err) {
      console.error("Erro ao salvar no MongoDB:", err);
    }
  }

  res.sendStatus(200);
});

// === Página de mensagens recebidas (HTML simples) ===
app.get("/", async (req, res) => {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db();
    const mensagens = await db.collection("mensagens").find().sort({ date: -1 }).toArray();
    await client.close();

    const html = mensagens
      .map(m => `<p><strong>${m.from}</strong>: ${m.msg} <em>(${m.date.toLocaleString()})</em></p>`)
      .join("");
    res.send(`<h1>Mensagens Recebidas</h1>${html}`);
  } catch (err) {
    res.status(500).send("Erro ao buscar mensagens.");
  }
});

// === Inicializa o servidor ===
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

