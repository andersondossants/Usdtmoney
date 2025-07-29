const { Client } = require('pg');

exports.handler = async function(event) {
  const email = event.queryStringParameters?.email;
  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email não informado" })
    };
  }

  const client = new Client({
    connectionString: process.env.NETLIFY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(
      "SELECT saldo FROM usuarios WHERE email = $1",
      [email]
    );
    await client.end();

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Usuário não encontrado" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ saldo: parseFloat(result.rows[0].saldo) })
    };
  } catch (error) {
    console.error("Erro ao buscar saldo:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor" })
    };
  }
};
