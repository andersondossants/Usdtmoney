const { Client } = require("pg");

exports.handler = async function(event) {
  const { email, valor, lucro_diario } = JSON.parse(event.body || "{}");

  if (!email || !valor || !lucro_diario) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "Dados incompletos" })
    };
  }

  // Define o próximo pagamento para 1 minuto no futuro
  const proximo_pagamento = new Date(Date.now() + 1 * 60 * 1000).toISOString();

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // 1. Salva o investimento
    await client.query(`
      INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
      VALUES ($1, $2, $3, $4)
    `, [email, valor, lucro_diario, proximo_pagamento]);

    // 2. Registra a transação no histórico
    await client.query(`
      INSERT INTO transacoes (email, tipo, valor, data)
      VALUES ($1, $2, $3, NOW())
    `, [email, 'Investimento', valor]);

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
