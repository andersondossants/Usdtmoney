const { Client } = require("pg");

exports.handler = async (event) => {
  const { email, valor, lucro_diario } = JSON.parse(event.body);
  const valorNum = parseFloat(valor);
  const lucroNum = parseFloat(lucro_diario);

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // Verifica saldo atual do usuÃ¡rio
    const saldoRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1", [email]);
    if (saldoRes.rows.length === 0) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "UsuÃ¡rio nÃ£o encontrado." }) };
    }
    const saldoAtual = parseFloat(saldoRes.rows[0].saldo);
    if (saldoAtual < valorNum) {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Saldo insuficiente." }) };
    }

    // Insere investimento e define prÃ³ximo pagamento para daqui 5 minutos
    const insert = await client.query(
      `INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
       VALUES ($1, $2, $3, NOW() + interval '5 minutes') RETURNING *`,
      [email, valorNum, lucroNum]
    );

    // Atualiza saldo do usuÃ¡rio subtraindo o valor investido
    await client.query(
      "UPDATE usuarios SET saldo = saldo - $1 WHERE email = $2",
      [valorNum, email]
    );
// Registrar transaÃ§Ã£o
    await client.query(
      `INSERT INTO transacoes (email, tipo, valor, data)
       VALUES ($1, 'Investimento', $2, NOW())`,
      [email, valorNum]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true, investimento: insert.rows[0] })
    };
    // Busca saldo atualizado
    const saldoAtualizadoRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1", [email]);
    const saldoAtualizado = parseFloat(saldoAtualizadoRes.rows[0].saldo);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        saldo: saldoAtualizado,
        investimento: insert.rows[0],
      }),
    };
  } catch (error) {
    console.error("Erro em salvarInvestimento:", error);
    await client.end();
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: error.message }),
    };
  }
};
