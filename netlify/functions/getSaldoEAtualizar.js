const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const CYCLE_MS = 2 * 60 * 1000; // 2 minutos

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ sucesso: false, mensagem: "Método não permitido" }) };
  }

  const email = event.queryStringParameters?.email;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "Email não informado" }) };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock no usuário para atualizar saldo com segurança
    const userRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1 FOR UPDATE", [email]);
    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return { statusCode: 404, body: JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }) };
    }

    const nowMs = Date.now();

    // Lock em todos os investimentos do usuário
    const invRes = await client.query(
      `SELECT id, lucro_diario, EXTRACT(EPOCH FROM proximo_pagamento) AS proximo_epoch
         FROM investimentos
        WHERE email = $1
        FOR UPDATE`,
      [email]
    );

    let totalCredito = 0;
    let menorProximo = null;
    const creditosDetalhados = [];

    for (const inv of invRes.rows) {
      const proximoMs = Math.floor(parseFloat(inv.proximo_epoch) * 1000);

      if (isFinite(proximoMs) && nowMs >= proximoMs) {
        // Quantos ciclos passaram (inclui o que venceu agora)
        const diffMs = nowMs - proximoMs;
        const ciclos = Math.floor(diffMs / CYCLE_MS) + 1; // +1 para o ciclo vencido
        const credito = ciclos * parseFloat(inv.lucro_diario);
        totalCredito += credito;

        const novoProximoMs = proximoMs + ciclos * CYCLE_MS;

        // Atualiza proximo_pagamento desse investimento
        await client.query(
          "UPDATE investimentos SET proximo_pagamento = to_timestamp($1 / 1000.0) WHERE id = $2",
          [novoProximoMs, inv.id]
        );

        creditosDetalhados.push({ investimento_id: inv.id, ciclos, valor: credito });

        if (menorProximo === null || novoProximoMs < menorProximo) menorProximo = novoProximoMs;
      } else {
        // Sem ciclos; ainda assim calcula menor proximo
        if (menorProximo === null || proximoMs < menorProximo) menorProximo = proximoMs;
      }
    }

    // Aplica crédito acumulado no saldo e registra transações
    if (totalCredito > 0) {
      await client.query("UPDATE usuarios SET saldo = saldo + $1 WHERE email = $2", [totalCredito, email]);

      // Registra 1 transação por investimento (resumo), para auditoria
      for (const c of creditosDetalhados) {
        await client.query(
          `INSERT INTO transacoes (email, tipo, valor, data)
           VALUES ($1, 'Lucro', $2, NOW())`,
          [email, c.valor]
        );
      }
    }

    const saldoFinalRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1", [email]);
    const saldoFinal = parseFloat(saldoFinalRes.rows[0].saldo);

    await client.query("COMMIT");

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        saldo: saldoFinal,
        lucro_creditado: totalCredito,
        proximo_pagamento_global: menorProximo ? new Date(menorProximo).toISOString() : null,
      }),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro em getSaldoEAtualizar:", err);
    return { statusCode: 500, body: JSON.stringify({ sucesso: false, mensagem: err.message }) };
  } finally {
    client.release();
  }
};
