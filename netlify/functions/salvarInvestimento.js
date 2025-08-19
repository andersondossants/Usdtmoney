const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ sucesso: false, mensagem: "Método não permitido" }),
    };
  }

  let dados;
  try {
    dados = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "JSON inválido" }),
    };
  }

  const { email, valor, lucro_diario } = dados;

  if (!email || !Number.isFinite(valor) || valor <= 0 || !Number.isFinite(lucro_diario) || lucro_diario <= 0) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "Dados inválidos" }),
    };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Bloqueia saldo do usuário para atualização segura
    const userRes = await client.query(
      "SELECT saldo FROM usuarios WHERE email = $1 FOR UPDATE",
      [email]
    );
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        statusCode: 404,
        body: JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }),
      };
    }

    const saldoAtual = parseFloat(userRes.rows[0].saldo);
    if (saldoAtual < valor) {
      await client.query("ROLLBACK");
      return {
        statusCode: 400,
        body: JSON.stringify({ sucesso: false, mensagem: "Saldo insuficiente" }),
      };
    }

    // Debita o valor investido
    await client.query(
      "UPDATE usuarios SET saldo = saldo - $1 WHERE email = $2",
      [valor, email]
    );

    // Define o próximo pagamento para daqui a 2 minutos (no DB)
    await client.query(
      `INSERT INTO investimentos (email, valor, lucro_diario, proximo_pagamento)
       VALUES ($1, $2, $3, NOW() + INTERVAL '2 minutes')`,
      [email, valor, lucro_diario]
    );

    // Registra transação
    await client.query(
      `INSERT INTO transacoes (email, tipo, valor, data)
       VALUES ($1, 'Investimento', $2, NOW())`,
      [email, valor]
    );

    // Saldo final
    const saldoFinalRes = await client.query(
      "SELECT saldo FROM usuarios WHERE email = $1",
      [email]
    );
    const saldoFinal = parseFloat(saldoFinalRes.rows[0].saldo);

    await client.query("COMMIT");

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        saldo: saldoFinal
      }),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro em salvarInvestimento:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: err.message }),
    };
  } finally {
    client.release();
  }
};
