const express = require("express");
const axios = require("axios");
const { MongoClient } = require("mongodb");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔐 Configurações
const TOKEN = "EAAJtoiFNp9wBPPwsGWw2TbW5ZCdMQYCT7o9uMSVqtFznuZCFfxFEJnWb9zDIJV4bXMrdzJRG8wj3WRHil8RN1ZAMwJeJNptNhJoB9E1c3YolyJBmtIZCoYQZAoce4Pe9VSsZADJxK6Mo0YCpkUFPX5pMm9yTSutRZAExVexIkIyGzhD3P9ShkPci5l7uNtIineRlCINguZAvZBX8vwvoTBm1ZAZBdpAMB1W2ZARb4kwjzgZDZD";
const PHONE_NUMBER_ID = "658464957355487";
const VERIFY_TOKEN = "meu_token";
const MONGO_URI = "mongodb+srv://Klishiman:MinhaSenha++@cluster0.ndtbrp6.mongodb.net/whatsappDB?retryWrites=true&w=majority";

const client = new MongoClient(MONGO_URI);
app.use(express.json());

// ✅ Verificação do Webhook
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("🔗 Webhook verificado.");
    return res.status(200).send(challenge);
  } else {
    return res.sendStatus(403);
  }
});

// ✅ Recebimento e resposta automática
app.post("/webhook", async (req, res) => {
  try {
    const mensagem = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    const numero = mensagem?.from;
    const texto = mensagem?.text?.body;

    if (mensagem && texto) {
      console.log(`📩 Mensagem recebida de ${numero}: ${texto}`);

      // Enviar resposta automática
      await axios.post(
        `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: "whatsapp",
          to: numero,
          type: "text",
          text: {
            body: "Olá! Recebemos sua mensagem. Em breve nossa equipe entrará em contato.",
          },
        },
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("✅ Resposta automática enviada");

      // Salvar no MongoDB
      await client.connect();
      const db = client.db("whatsappDB");
      const mensagens = db.collection("mensagens");
      await mensagens.insertOne({
        numero,
        mensagem: texto,
        data: new Date(),
      });
    }
  } catch (err) {
    console.error("❌ Erro ao processar mensagem:", err.message);
  }

  res.sendStatus(200);
});

// ✅ Rota para visualizar mensagens em HTML
app.get("/", async (req, res) => {
  try {
    await client.connect();
    const db = client.db("whatsappDB");
    const mensagens = await db.collection("mensagens").find().toArray();

    let html = `
      <h1>Mensagens Recebidas</h1>
      <ul style="font-family: Arial">
    `;
    mensagens.forEach((msg) => {
      html += `<li><strong>${msg.numero}</strong>: ${msg.mensagem} <em>(${new Date(msg.data).toLocaleString()})</em></li>`;
    });
    html += "</ul>";

    res.send(html);
  } catch (err) {
    res.status(500).send("Erro ao carregar mensagens.");
  }
});

// ✅ Start
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
