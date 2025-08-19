const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const CYCLE_MS = 24 * 60 * 60 * 1000; // 24 horas

exports.handler = async (event) => {
  const email = event.queryStringParameters?.email;
  if (!email) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "Email não informado" })
    };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Bloqueia o usuário para atualização consistente
    const userRes = await client.query(
      "SELECT saldo FROM usuarios WHERE email = $1 FOR UPDATE",
      [email]
    );

    if (userRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return {
        statusCode: 200,
        body: JSON.stringify({ sucesso: true, saldo: 0, lucro_creditado: 0 })
      };
    }

    let saldo = Number(userRes.rows[0].saldo) || 0;

    // Busca e bloqueia os investimentos do usuário
    const invRes = await client.query(
      "SELECT id, lucro_diario, proximo_pagamento FROM investimentos WHERE email = $1 FOR UPDATE",
      [email]
    );

    const agora = Date.now();
    let totalCredito = 0;

    for (const inv of invRes.rows) {
      const lucroPorCiclo = Number(inv.lucro_diario) || 0;
      const prox = inv.proximo_pagamento ? new Date(inv.proximo_pagamento).getTime() : null;
      if (!prox || lucroPorCiclo <= 0) continue;

      if (agora >= prox) {
        // Pelo menos 1 ciclo venceu; soma todos os ciclos completos vencidos
        const ciclosVencidos = Math.floor((agora - prox) / CYCLE_MS) + 1;
        const ganho = ciclosVencidos * lucroPorCiclo;
        totalCredito += ganho;

        // Empurra o próximo pagamento adiante exatamente ciclos vencidos
        const novoProximo = new Date(prox + ciclosVencidos * CYCLE_MS);

        await client.query(
          "UPDATE investimentos SET proximo_pagamento = $1 WHERE id = $2",
          [novoProximo, inv.id]
        );
      }
    }

    if (totalCredito > 0) {
      saldo += totalCredito;

      await client.query(
        "UPDATE usuarios SET saldo = $1 WHERE email = $2",
        [saldo, email]
      );

      // (Opcional) registrar a transação de lucro consolidado
      await client.query(
        "INSERT INTO transacoes (email, tipo, valor, data) VALUES ($1, 'Lucro', $2, NOW())",
        [email, totalCredito]
      );
    }

    await client.query("COMMIT");

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        saldo,
        lucro_creditado: totalCredito
      })
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Erro no getSaldoEAtualizar:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: "Erro no servidor" })
    };
  } finally {
    client.release();
  }
};
