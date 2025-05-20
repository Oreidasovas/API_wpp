const express = require('express');
const app = express();

app.get('/webhook', (req, res) => {
  const challenge = req.query['hub.challenge'];
  const token = req.query['hub.verify_token'];

  if (token === 'meu_token') {
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Token inválido');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
