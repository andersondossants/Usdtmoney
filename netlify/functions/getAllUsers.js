const { Client } = require('pg');

exports.handler = async function (event) {
  const adminEmail = "boylouco512@gmail.com";

  // Verifica se o email foi enviado na URL
  const email = event.queryStringParameters?.email;
  if (email !== adminEmail) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Acesso negado" })
    };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URI,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Query para listar usuários
    const result = await client.query("SELECT id, email, saldo, referencia FROM usuarios");
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
