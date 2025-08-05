const { Neon } = require("@cityssm/neon-db");

exports.handler = async (event) => {
  const { email, tipo, valor, data } = JSON.parse(event.body || "{}");

  if (!email || !tipo || !valor || !data) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Campos obrigatórios ausentes." })
    };
  }

  const db = new Neon({ database: "usdtmoney" }); // <-- Aqui está corrigido

  try {
    await db.query(`
      INSERT INTO transacoes (email, tipo, valor, data)
      VALUES ($1, $2, $3, $4)
    `, [email, tipo, valor, data]);

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true })
    };
  } catch (error) {
    console.error("Erro ao salvar transação:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro ao salvar transação" })
    };
  }
};
