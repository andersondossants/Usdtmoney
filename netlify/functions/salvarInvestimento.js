const { Client } = require("pg");

exports.handler = async function(event) {
  const { email, valor, lucro_diario, proximo_pagamento } = JSON.parse(event.body || "{}");

  if (!email || !valor || !lucro_diario || !proximo_pagamento) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "Dados incompletos" })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    await client.query(`
      INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
      VALUES ($1, $2, $3, $4)
    `, [email, valor, lucro_diario, proximo_pagamento]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true })
    };
  } catch (err) {
    console.error("Erro ao salvar investimento:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: "Erro no servidor" })
    };
  }
};
