const { Client } = require("pg");

exports.handler = async function(event) {
  const { email } = JSON.parse(event.body || "{}");

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ erro: "Email não fornecido" })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const resultado = await client.query(
      `SELECT valor, lucro_diario, proximo_pagamento FROM investimentos WHERE email = $1 ORDER BY id DESC`,
      [email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ pacotes: resultado.rows })
    };
  } catch (erro) {
    console.error("Erro ao carregar pacotes:", erro);
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: "Erro ao carregar pacotes" })
    };
  }
};
