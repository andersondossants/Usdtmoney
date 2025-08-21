const { Client } = require('pg');

exports.handler = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Busca todos os saques com endereço e rede
    const result = await client.query(
      'SELECT id, email, valor, status, rede, endereco FROM saques ORDER BY id DESC'
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };

  } catch (error) {
    console.error("Erro ao carregar saques:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
