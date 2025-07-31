const { Client } = require('pg');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  const { email, saldo } = JSON.parse(event.body || '{}');

  if (!email || saldo === undefined) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Informe email e saldo" })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query(
      "UPDATE usuarios SET saldo = $1 WHERE email = $2 RETURNING email, saldo",
      [saldo, email]
    );
    await client.end();

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Usuário não encontrado" })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, usuario: result.rows[0] })
    };
  } catch (error) {
    console.error("Erro ao atualizar saldo:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno no servidor" })
    };
  }
};
