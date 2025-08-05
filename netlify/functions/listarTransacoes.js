const { Neon } = require("@cityssm/neon-db");

exports.handler = async (event) => {
  const email = event.queryStringParameters?.email;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Email ausente." })
    };
  }

  const db = new Neon({ database: "usdtmoney" });

  try {
    const transacoes = await db.all(`
      SELECT tipo, valor, data
      FROM transacoes
      WHERE email = $1
      ORDER BY data DESC
      LIMIT 20
    `, [email]);

    return {
      statusCode: 200,
      body: JSON.stringify({ transacoes })
    };
  } catch (error) {
    console.error("Erro ao buscar transações:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao buscar transações." })
    };
  }
};
