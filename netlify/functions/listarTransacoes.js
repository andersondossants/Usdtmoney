const { Client } = require("pg");

exports.handler = async (event) => {
  const email = event.queryStringParameters?.email;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email obrigatório" })
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT tipo, valor, data FROM transacoes WHERE email = $1 ORDER BY data DESC",
      [email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows)
    };
  } catch (error) {
    console.error("Erro ao listar transações:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno ao buscar transações" })
    };
  }
};
