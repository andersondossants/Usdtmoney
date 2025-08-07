const { Client } = require("pg");

exports.handler = async function(event) {
  const { email, valor } = JSON.parse(event.body || "{}");

  if (!email || !valor) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "Dados incompletos" })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  // 💸 Lucro por minuto (1% por minuto)
  const lucro_por_minuto = valor * 0.01;

  // ⏰ Próximo pagamento em 1 minuto
  const proximo_pagamento = new Date(Date.now() + 1 * 60 * 1000).toISOString();

  try {
    await client.connect();

    // 1. Salva o investimento
    await client.query(`
      INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
      VALUES ($1, $2, $3, $4)
    `, [email, valor, lucro_por_minuto, proximo_pagamento]);

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
