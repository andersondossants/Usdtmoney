const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Neon exige SSL
    });

    await client.connect();

    // Busca o depósito
    const deposito = await client.query(
      'SELECT email, valor, status FROM depositos WHERE id = $1',
      [id]
    );

    if (deposito.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: JSON.stringify({ error: "Depósito não encontrado" }) };
    }

    const { email, valor, status } = deposito.rows[0];
    if (status !== 'pendente') {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ error: "Depósito já processado" }) };
    }

    // Atualiza status do depósito
    await client.query(
      'UPDATE depositos SET status = $1 WHERE id = $2',
      ['aprovado', id]
    );

    // Adiciona saldo ao usuário
    await client.query(
      'UPDATE usuarios SET saldo = saldo + $1 WHERE email = $2',
      [valor, email]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("Erro ao aprovar depósito:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno no servidor" }) };
  }
};
