const { Client } = require("pg");

exports.handler = async function(event, context) {
  const { email } = JSON.parse(event.body || "{}");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    const result = await client.query(
      "SELECT tipo, valor, data FROM transacoes WHERE email = $1 ORDER BY data DESC LIMIT 100",
      [email]
    );

    await client.end();
    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: "Erro ao buscar histórico de transações." }),
    };
  }
};
