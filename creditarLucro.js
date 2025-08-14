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

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "JSON inválido" }),
    };
  }

  const { email, lucro } = data;
  if (!email || isNaN(lucro)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ sucesso: false, mensagem: "Dados inválidos" }),
    };
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Atualiza saldo
    await client.query(
      "UPDATE usuarios SET saldo = saldo + $1 WHERE email = $2",
      [lucro, email]
    );

    // Atualiza próximo pagamento para 2 minutos à frente
    await client.query(
      "UPDATE investimentos SET proximo_pagamento = NOW() + interval '2 minutes' WHERE email = $1",
      [email]
    );

    // Registra transação de lucro
    await client.query(
      `INSERT INTO transacoes (email, tipo, valor, data)
       VALUES ($1, 'Lucro', $2, NOW())`,
      [email, lucro]
    );

    await client.query("COMMIT");

    // Retorna saldo atualizado
    const saldoRes = await client.query(
      "SELECT saldo FROM usuarios WHERE email = $1",
      [email]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        sucesso: true,
        saldo: parseFloat(saldoRes.rows[0].saldo),
      }),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro em creditarLucro:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: err.message }),
    };
  } finally {
    client.release();
  }
};
