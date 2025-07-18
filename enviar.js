const axios = require("axios");

// 🔐 CONFIGURAÇÕES
const TOKEN = "SEU_TOKEN_AQUI"; // Substitua pelo seu token de acesso
const PHONE_NUMBER_ID = "SEU_PHONE_NUMBER_ID"; // Ex: 123456789
const TEMPLATE_NAME = "nome_do_template_aprovado"; // ex: "promo_desconto"
const LANGUAGE_CODE = "pt_BR"; // ou en_US, es_ES etc.

const DESTINATARIOS = [
  { numero: "5511999999999", nome: "Gabriel", desconto: "25%" },
  { numero: "5521988888888", nome: "Camila", desconto: "30%" },
  { numero: "5531997777777", nome: "Carlos", desconto: "15%" }
];

// 🔁 Função para enviar template para 1 número
async function enviarTemplate(destinatario) {
  const payload = {
    messaging_product: "whatsapp",
    to: destinatario.numero,
    type: "template",
    template: {
      name: TEMPLATE_NAME,
      language: { code: LANGUAGE_CODE },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: destinatario.nome },
            { type: "text", text: destinatario.desconto }
          ]
        }
      ]
    }
  };

  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`✅ Mensagem enviada para ${destinatario.numero}`);
  } catch (error) {
    console.error(`❌ Erro ao enviar para ${destinatario.numero}:`, error.response?.data || error.message);
  }
}

// 🚀 Envio em massa
async function enviarEmMassa() {
  for (const destinatario of DESTINATARIOS) {
    await enviarTemplate(destinatario);
  }
}

enviarEmMassa();
