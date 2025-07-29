// netlify/functions/updateSaldo.js
const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { email, saldo } = JSON.parse(event.body);

  if (!email || saldo === undefined) {
    return { statusCode: 400, body: JSON.stringify({ error: "Dados inválidos" }) };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    await client.query('UPDATE usuarios SET saldo = $1 WHERE email = $2', [saldo, email]);
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, saldo })
    };
  } catch (err) {
    console.error('Erro ao atualizar saldo:', err);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro no servidor" }) };
  }
};￼Enter
