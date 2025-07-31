const { Client } = require('pg');

exports.handler = async function (event) {
  const email = event.queryStringParameters?.email;
  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email não informado" })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL, // <- importante
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT id, email, saldo, referencia FROM usuarios WHERE email = $1",
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
      body: JSON.stringify(result.rows[0])
    };
  } catch (error) {
    console.error("Erro getSaldo:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor" })
    };
  }
};
