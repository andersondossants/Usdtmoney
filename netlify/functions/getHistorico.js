// /.netlify/functions/getHistorico.js
const { Database } = require("@neondatabase/serverless");
const db = new Database(process.env.DATABASE_URL);

exports.handler = async (event) => {
  try {
    const email = event.queryStringParameters.email;

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email não fornecido." })
      };
    }

    const result = await db.sql`
      SELECT tipo, valor, data
      FROM transacoes
      WHERE email = ${email}
      ORDER BY data DESC
      LIMIT 50
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ transacoes: result.rows })
    };
  } catch (err) {
    console.error("Erro ao buscar histórico:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao buscar histórico." })
    };
  }
};
