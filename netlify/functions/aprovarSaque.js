const { Client } = require('pg');

exports.handler = async (event) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const body = JSON.parse(event.body);
    const id = body.id;

    await client.connect();

    // Verifica se o saque existe
    const result = await client.query('SELECT email, valor FROM saques WHERE id=$1', [id]);

    if (result.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: 'Saque não encontrado' };
    }

    const { email, valor } = result.rows[0];

    // Aprova o saque
    await client.query('UPDATE saques SET status=$1 WHERE id=$2', ['aprovado', id]);

    // Atualiza saldo do usuário
    await client.query('UPDATE usuarios SET saldo = saldo - $1 WHERE email=$2', [valor, email]);

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };
  } catch (err) {
    console.error('Erro ao aprovar saque:', err);
    return {
      statusCode: 500,
      body: 'Erro ao aprovar saque'
    };
  }
};
