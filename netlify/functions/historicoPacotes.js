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
      "SELECT nome, valor, rendimento, data FROM pacotes WHERE email = $1 ORDER BY data DESC LIMIT 100",
      [email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(result.rows),
    };
  } catch (error) {
    console.error("Erro ao buscar pacotes:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ erro: "Erro ao buscar histórico de pacotes." }),
    };
  }
};
