const { Client } = require("pg");

exports.handler = async function(event) {
  const { email } = JSON.parse(event.body || "{}");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    // Buscar dados do usuário
    const res = await client.query("SELECT saldo, rendimento, proximo_pagamento FROM usuarios WHERE email = $1", [email]);
    if (res.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ sucesso: false, mensagem: "Usuário não encontrado" }) };
    }

    const usuario = res.rows[0];
    const agora = new Date();

    if (!usuario.proximo_pagamento || new Date(usuario.proximo_pagamento) > agora) {
      return { statusCode: 200, body: JSON.stringify({ sucesso: false, mensagem: "⏱️ Ainda não está disponível o lucro." }) };
    }

    const novoSaldo = parseFloat(usuario.saldo) + parseFloat(usuario.rendimento);
    const proximoPagamento = new Date(agora.getTime() + 24 * 60 * 60 * 1000); // +24h

    await client.query(`
      UPDATE usuarios 
      SET saldo = $1, proximo_pagamento = $2 
      WHERE email = $3
    `, [novoSaldo, proximoPagamento, email]);

    // Salvar transação no histórico
    await client.query(`
      INSERT INTO transacoes (email, tipo, valor, data) 
      VALUES ($1, $2, $3, NOW())
    `, [email, "Lucro Diário", usuario.rendimento]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ sucesso: true, valor: usuario.rendimento })
    };
  } catch (err) {
    console.error("Erro ao liberar lucro:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ sucesso: false, mensagem: "Erro no servidor." })
    };
  }
};
