const { Client } = require('pg');

exports.handler = async (event) => {
  try {
    const { id } = JSON.parse(event.body);

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    // Busca o depósito
    const deposito = await client.query(
      'SELECT email, valor FROM depositos WHERE id=$1',
      [id]
    );

    if (deposito.rows.length === 0) {
      await client.end();
      return { statusCode: 404, body: 'Depósito não encontrado' };
    }

    const { email, valor } = deposito.rows[0];

    // Atualiza o status
    await client.query(
      'UPDATE depositos SET status=$1 WHERE id=$2',
      ['aprovado', id]
    );

    // Aumenta o saldo do usuário
    await client.query(
      'UPDATE usuarios SET saldo = saldo + $1 WHERE email=$2',
      [valor, email]
    );

    await client.end();
    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error('Erro ao aprovar depósito:', err);
    return { statusCode: 500, body: 'Erro ao aprovar depósito' };
  }
};
