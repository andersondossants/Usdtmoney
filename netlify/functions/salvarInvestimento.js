const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

exports.handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ sucesso: false, mensagem: "Método não permitido." }) };
  }

  const email = event.queryStringParameters.email;
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ sucesso: false, mensagem: "E-mail não informado." }) };
  }

  const client = await pool.connect();

  try {
    // Buscar investimento ativo do usuário
    const invRes = await client.query(
      "SELECT * FROM investimentos WHERE email = $1 ORDER BY id DESC LIMIT 1",
      [email]
    );

    if (invRes.rows.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ ativo: false }) };
    }

    const investimento = invRes.rows[0];
    let saldoUsuario = 0;

    // Buscar saldo do usuário
    const saldoRes = await client.query("SELECT saldo FROM usuarios WHERE email = $1", [email]);
    if (saldoRes.rows.length > 0) {
      saldoUsuario = parseFloat(saldoRes.rows[0].saldo);
    }

    const agora = Date.now();
    let proximo = new Date(investimento.proximo_pagamento).getTime();
    const lucroDiario = parseFloat(investimento.lucro_diario);
    let saldoNovo = saldoUsuario;

    // Calcular ciclos que passaram
    let ciclos = 0;
    while (agora >= proximo) {
      saldoNovo += lucroDiario;
      proximo += 2 * 60 * 1000; // próximo ciclo
      ciclos++;
    }

    // Se houver ciclos, atualizar no banco
    if (ciclos > 0) {
      await client.query(
        "UPDATE usuarios SET saldo = $1 WHERE email = $2",
        [saldoNovo, email]
      );

      await client.query(
        "UPDATE investimentos SET proximo_pagamento = to_timestamp($1 / 1000.0) WHERE id = $2",
        [proximo, investimento.id]
      );

      await client.query(
        "INSERT INTO transacoes (email, tipo, valor, data) VALUES ($1, 'Lucro', $2, NOW())",
        [email, lucroDiario * ciclos]
      );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        ativo: true,
        saldo: saldoNovo,
        lucro_diario: lucroDiario,
        proximo_pagamento: proximo
      }),
    };
  } catch (error) {
    console.error("Erro verificarInvestimento:", error);
    return { statusCode: 500, body: JSON.stringify({ sucesso: false, mensagem: error.message }) };
  } finally {
    client.release();
  }
};
