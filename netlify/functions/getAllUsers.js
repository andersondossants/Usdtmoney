// netlify/functions/getAllUsers.js
const { Client } = require('pg');

exports.handler = async function(event) {
  // E-mail do admin que pode acessar a lista
  const adminEmail = "boylouco512@gmail.com";

  const email = event.queryStringParameters?.email;
  if (email !== adminEmail) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Acesso negado" }),
    };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query('SELECT email, saldo FROM usuarios');
    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (err) {
    console.error('Erro ao buscar usuários:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Erro interno no servidor' }),
    };
  }
};￼Enter
