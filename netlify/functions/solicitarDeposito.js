const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Método não permitido" };
  }

  const { email, valor } = JSON.parse(event.body || "{}");

  // Validações básicas
  if (!email || !valor || valor < 5) {
    return { statusCode: 400, body: "Depósito mínimo é 5 USDT" };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Insere pedido de depósito com status pendente
    await client.query(
      "INSERT INTO depositos (email, valor, status) VALUES ($1, $2, 'pendente')",
      [email, valor]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Depósito solicitado com sucesso!" }),
    };
  } catch (err) {
    console.error("Erro ao salvar depósito:", err);
    return { statusCode: 500, body: "Erro ao salvar depósito" };
  }
};
