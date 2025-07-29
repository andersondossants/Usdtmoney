// netlify/functions/getSaldo.js
const { Client } = require('pg');

exports.handler = async (event) => {
  const email = event.queryStringParameters?.email;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: "E-mail é obrigatório" }) };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT saldo FROM usuarios WHERE email = $1', [email]);
    await client.end();

    if (result.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Usuário não encontrado" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ saldo: result.rows[0].saldo })
    };
  } catch (err) {
    console.error('Erro ao buscar saldo:', err);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro no servidor" }) };
  }
};￼Enter
