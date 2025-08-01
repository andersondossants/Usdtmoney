const { Client } = require('pg');

exports.handler = async (event) => {
  const { email, valor } = JSON.parse(event.body || '{}');

  if (!email || !valor) {
    return { statusCode: 400, body: JSON.stringify({ error: "Informe email e valor" }) };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query(
      "INSERT INTO depositos (email, valor, status) VALUES ($1, $2, 'pendente')",
      [email, valor]
    );
    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error("Erro solicitarDeposito:", error);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno" }) };
  }
};
