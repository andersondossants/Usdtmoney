const { Client } = require("pg");

exports.handler = async (event) => {
  const email = event.queryStringParameters.email;

  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "E-mail não informado." }),
    };
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Busca investimento mais recente do usuário
    const investRes = await client.query(
      `SELECT valor, lucro_diario, proximo_pagamento
       FROM investimentos
       WHERE email = $1
       ORDER BY id DESC
       LIMIT 1`,
      [email]
    );

    if (investRes.rows.length === 0) {
      await client.end();
      return {
        statusCode: 200,
        body: JSON.stringify({ ativo: false }),
      };
    }

    // Busca saldo atual
    const saldoRes = await client.query(
      `SELECT saldo FROM usuarios WHERE email = $1`,
      [email]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        ativo: true,
        valor: parseFloat(investRes.rows[0].valor),
        lucro_diario: parseFloat(investRes.rows[0].lucro_diario),
        proximo_pagamento: investRes.rows[0].proximo_pagamento,
        saldo: parseFloat(saldoRes.rows[0].saldo),
      }),
    };

  } catch (error) {
    console.error("Erro em verificarInvestimento:", error);
    await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: error.message }),
    };
  }
};
