const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ sucesso: false, mensagem: "Método não permitido." }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "JSON inválido." }) };
  }

  const { email, valor, lucro_diario } = data;
  const valorNum = parseFloat(valor);
  const lucroNum = parseFloat(lucro_diario);

  if (!email || isNaN(valorNum) || isNaN(lucroNum) || valorNum <= 0 || lucroNum <= 0) {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Dados inválidos." }) };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Verifica saldo do usuário
    const saldoRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1 FOR UPDATE", [email]);
    if (saldoRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado." }) };
    }

    const saldoAtual = parseFloat(saldoRes.rows[0].saldo);
    if (saldoAtual < valorNum) {
      await client.query("ROLLBACK");
      return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Saldo insuficiente." }) };
    }

    // Cria investimento com primeiro pagamento para +2min
    const invRes = await client.query(
      `INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
       VALUES ($1, $2, $3, NOW() + interval '2 minutes')
       RETURNING id, valor, lucro_diario, proximo_pagamento`,
      [email, valorNum, lucroNum]
    );

    // Debita valor investido
    await client.query("UPDATE usuarios SET saldo = saldo - $1 WHERE email = $2", [valorNum, email]);

    // Transação de investimento
    await client.query(
      `INSERT INTO transacoes (email, tipo, valor, data) VALUES ($1, 'Investimento', $2, NOW())`,
      [email, valorNum]
    );

    // Saldo atualizado
    const saldoAtualizado = await client.query("SELECT saldo FROM usuarios WHERE email = $1", [email]);

    await client.query("COMMIT");
    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        saldo: parseFloat(saldoAtualizado.rows[0].saldo),
        investimento: invRes.rows[0],
      }),
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Erro em salvarInvestimento:", error);
    return { statusCode: 500, body: JSON.stringify({ sucesso: false, mensagem: error.message }) };
  } finally {
    client.release();
  }
};
