const { Client } = require('pg');

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  try {
    const { id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false } // Necessário no Neon
    });

    await client.connect();

    // Pega dados do saque
    const saque = await client.query(
      'SELECT email, valor, status FROM saques WHERE id = $1',
      [id]
    );

    if (saque.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: JSON.stringify({ error: "Saque não encontrado" }) };
    }

    const { email, valor, status } = saque.rows[0];
    if (status !== 'pendente') {
      await client.end();
      return { statusCode: 400, body: JSON.stringify({ error: "Saque já processado" }) };
    }

    // Atualiza status do saque
    await client.query(
      'UPDATE saques SET status = $1 WHERE id = $2',
      ['aprovado', id]
    );

    // Subtrai do saldo do usuário
    await client.query(
      'UPDATE usuarios SET saldo = saldo - $1 WHERE email = $2',
      [valor, email]
    );

    await client.end();

    return { statusCode: 200, body: JSON.stringify({ success: true }) };

  } catch (err) {
    console.error("Erro ao aprovar saque:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Erro interno no servidor" }) };
  }
};
