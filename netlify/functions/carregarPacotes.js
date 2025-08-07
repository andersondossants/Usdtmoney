const { Client } = require('pg');

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const resultado = await client.query(
      "SELECT valor, lucro_diario, proximo_pagamento FROM investimentos WHERE email = $1 ORDER BY data_investimento DESC",
      [email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ pacotes: resultado.rows })
    };
  } catch (error) {
    console.error("Erro ao carregar pacotes:", error);
    await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ pacotes: [] })
    };
  }
};
