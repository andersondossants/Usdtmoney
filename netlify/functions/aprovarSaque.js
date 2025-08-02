const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const { id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Busca o saque pelo id
    const saque = await client.query('SELECT email, valor FROM saques WHERE id=$1', [id]);
    if (saque.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: 'Saque não encontrado' };
    }

    const { email, valor } = saque.rows[0];

    // Atualiza status
    await client.query('UPDATE saques SET status=$1 WHERE id=$2', ['aprovado', id]);

    // Reduz saldo
    await client.query('UPDATE usuarios SET saldo = saldo - $1 WHERE email=$2', [valor, email]);

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Erro ao aprovar saque:', err);
    return { statusCode: 500, body: 'Erro ao aprovar saque' };
  }
};
