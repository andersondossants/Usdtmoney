const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const { id } = JSON.parse(event.body);

    await client.connect();

    // 1. Pega os dados do saque
    const saque = await client.query('SELECT email, valor FROM saques WHERE id=$1', [id]);
    if (saque.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: 'Saque não encontrado' };
    }

    const { email, valor } = saque.rows[0];

    // 2. Atualiza o status para aprovado
    await client.query('UPDATE saques SET status=$1 WHERE id=$2', ['aprovado', id]);

    // 3. Diminui o saldo do usuário (opcional)
    await client.query('UPDATE users SET saldo = saldo - $1 WHERE email=$2', [valor, email]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error("Erro ao aprovar saque:", err);
    return { statusCode: 500, body: "Erro ao aprovar saque" };
  }
};
