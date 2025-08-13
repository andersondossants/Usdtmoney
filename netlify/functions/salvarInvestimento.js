const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event) => {
  // Garantir que é POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ sucesso: false, mensagem: "Método não permitido." }) };
  }

  // Validar JSON recebido
  let data;
  try {
    data = JSON.parse(event.body || "{}");
  } catch (err) {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "JSON inválido." }) };
  }

  const { email, valor, lucro_diario } = data;
  const valorNum = parseFloat(valor);
  const lucroNum = parseFloat(lucro_diario);

  if (!email || isNaN(valorNum) || isNaN(lucroNum)) {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Dados inválidos." }) };
  }

  const client = await pool.connect();

  try {
    // Verifica saldo do usuário
    const saldoRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1", [email]);
    if (saldoRes.rows.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado." }) };
    }

    const saldoAtual = parseFloat(saldoRes.rows[0].saldo);
    if (saldoAtual < valorNum) {
      return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Saldo insuficiente." }) };
    }

    // Insere investimento com próximo pagamento daqui 2 minutos
    const insert = await client.query(
      `INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
       VALUES ($1, $2, $3, NOW() + interval '2 minutes') RETURNING *`,
      [email, valorNum, lucroNum]
    );

    // Atualiza saldo do usuário
    await client.query(
      "UPDATE usuarios SET saldo = saldo - $1 WHERE email = $2",
      [valorNum, email]
    );

    // Registra transação
    await client.query(
      `INSERT INTO transacoes (email, tipo, valor, data)
       VALUES ($1, 'Investimento', $2, NOW())`,
      [email, valorNum]
    );

    // Busca saldo atualizado
    const saldoAtualizadoRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1", [email]);
    const saldoAtualizado = parseFloat(saldoAtualizadoRes.rows[0].saldo);

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
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: error.message }),
    };
  } finally {
    client.release(); // Libera conexão ao pool
  }
};
