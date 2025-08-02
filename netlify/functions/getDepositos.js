const { Client } = require('pg');

exports.handler = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Busca todos os pedidos de depósito
    const result = await client.query(
      'SELECT id, email, valor, status, rede FROM depositos ORDER BY id DESC'
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (err) {
    console.error("Erro ao listar depósitos:", err);
    return { statusCode: 500, body: "Erro ao buscar depósitos" };
  }
};
