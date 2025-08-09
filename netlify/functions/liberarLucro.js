const { Client } = require("pg");

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Busca investimentos prontos para liberar lucro
    const investimentos = await client.query(
      "SELECT id, lucro_diario FROM investimentos WHERE email = $1 AND NOW() >= proximo_pagamento",
      [email]
    );

    if (investimentos.rows.length === 0) {
      await client.end();
      return {
        statusCode: 200,
        body: JSON.stringify({ sucesso: false, mensagem: "Nenhum lucro disponível agora." }),
      };
    }

    let totalLucro = 0;

    for (const inv of investimentos.rows) {
      totalLucro += parseFloat(inv.lucro_diario);

      // Atualiza proximo_pagamento para 5 minutos a partir de agora
      await client.query(
        "UPDATE investimentos SET proximo_pagamento = NOW() + interval '5 minutes' WHERE id = $1",
        [inv.id]
      );
    }

    // Atualiza saldo do usuário somando o total do lucro
    await client.query(
      "UPDATE usuarios SET saldo = saldo + $1 WHERE email = $2",
      [totalLucro, email]
    );

    // Registra transação de lucro
    await client.query(
      "INSERT INTO transacoes (email, tipo, valor, data) VALUES ($1, 'Lucro', $2, NOW())",
      [email, totalLucro]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true, valor: totalLucro }),
    };
  } catch (error) {
    console.error("Erro ao liberar lucro:", error);
    await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: error.message }),
    };
  }
};
