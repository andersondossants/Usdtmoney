// /.netlify/functions/salvarTransacao.js
const { Database } = require("@neondatabase/serverless");
const db = new Database(process.env.DATABASE_URL);

exports.handler = async (event) => {
  try {
    const { email, tipo, valor, data } = JSON.parse(event.body);

    if (!email || !tipo || !valor || !data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Dados incompletos." })
      };
    }

    await db.sql`
      INSERT INTO transacoes (email, tipo, valor, data)
      VALUES (${email}, ${tipo}, ${valor}, ${data})
    `;

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true })
    };
  } catch (err) {
    console.error("Erro ao salvar transação:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao salvar transação." })
    };
  }
};
